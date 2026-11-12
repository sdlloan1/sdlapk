import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    // Get Google Sheets OAuth token (shared connector — builder's account)
    const { accessToken } = await base44.asServiceRole.connectors.getConnection("googlesheets");

    // Fetch all loans
    const loans = await base44.asServiceRole.entities.LoanApplication.list("-created_date", 1000);

    const statusLabels = {
      pending_disbursement: "Pending Disbursement",
      disbursed: "Active",
      pending_verification: "Payment Under Verification",
      repaid: "Repaid",
      overdue: "Overdue",
      rejected: "Rejected",
    };

    const formatDate = (d) => d ? new Date(d).toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata" }) : "";

    // Create a new spreadsheet
    const dateStr = new Date().toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata" });
    const createRes = await fetch("https://sheets.googleapis.com/v4/spreadsheets", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        properties: { title: `SDL Loan Export — ${dateStr}` },
      }),
    });

    if (!createRes.ok) {
      const err = await createRes.text();
      return Response.json({ error: `Failed to create spreadsheet: ${err}` }, { status: 500 });
    }

    const sheetData = await createRes.json();
    const spreadsheetId = sheetData.spreadsheetId;
    const spreadsheetUrl = sheetData.spreadsheetUrl;

    // Prepare data rows
    const headers = [
      "Loan ID", "User Name", "Mobile", "Amount (Rs)", "Charges (Rs)", "Repayment Amount (Rs)",
      "Due Date", "Status", "Loan Date", "Disbursed Date", "Repaid Date", "UPI ID", "Rejection Reason"
    ];

    const rows = loans.map((l) => [
      l.loan_id || "",
      l.user_name || "",
      l.user_mobile || "",
      l.amount || 0,
      l.interest_amount || 0,
      l.repayment_amount || 0,
      l.due_date || "",
      statusLabels[l.status] || l.status || "",
      formatDate(l.loan_date || l.created_date),
      formatDate(l.disbursed_date),
      formatDate(l.repaid_date),
      l.user_upi_id || "",
      l.admin_rejection_reason || "",
    ]);

    // Write all data in one request
    const writeRes = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/A1:append?valueInputOption=RAW`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ values: [headers, ...rows] }),
      }
    );

    if (!writeRes.ok) {
      const err = await writeRes.text();
      return Response.json({ error: `Failed to write data: ${err}` }, { status: 500 });
    }

    return Response.json({
      success: true,
      url: spreadsheetUrl,
      count: loans.length,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}