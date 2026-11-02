const plain = (n) => (Number(n) || 0).toLocaleString("en-IN");

function withAppUrl(body, appUrl) {
  const url = appUrl || "https://shubhdhanlakshmi.com";
  return `${body}\n\nVisit: ${url}`;
}

export function kycDonePendingLimitMessage(userName, appUrl) {
  return withAppUrl(`🪔 *KYC Verified* 🙏

Dear *${userName}*,

Congratulations! 🎉 Your KYC verification is complete.

Your loan limit will be assigned soon. You will receive an email notification once your limit is set.

Thank you very much for choosing SDL.

Regards,
SDL Team 🪔`, appUrl);
}

export function kycApprovedMessage(userName, limitAmount, appUrl) {
  return withAppUrl(`🪔 *KYC Approved* 🙏

Dear *${userName}*,

Congratulations! 🎉 Your loan limit is *₹${plain(limitAmount)}*.

We will increase your limit after good repayment history.

Thank you very much for choosing SDL.

Regards,
SDL Team 🪔`, appUrl);
}

export function limitIncreasedMessage(userName, increasedAmount, newLimit, appUrl) {
  return withAppUrl(`🪔 *Limit Increased* 🙏

Dear *${userName}*,

Congratulations! 🎉 Your limit has been increased by *₹${plain(increasedAmount)}*.
Your new limit is *₹${plain(newLimit)}*.

We will increase your limit further after good repayment history.

Thank you very much for choosing SDL.

Regards,
SDL Team 🪔`, appUrl);
}

export function loanDisbursedMessage(userName, loanAmount, repaymentAmount, repaymentDate, loanId, appUrl) {
  return withAppUrl(`🪔 *Loan Disbursed* 🙏

Dear *${userName}*,

Loan ID: *${loanId || "-"}*
Your Loan Amount: *₹${plain(loanAmount)}*
Your Repayment Amount: *₹${plain(repaymentAmount)}*
Your Repayment Date: *${repaymentDate}*

Thank you very much for choosing SDL.

Regards,
SDL Team 🪔`, appUrl);
}

export function repaymentVerifiedMessage(userName, repaymentAmount, currentLimit, loanId, appUrl) {
  return withAppUrl(`🪔 *Repayment Verified* 🙏

Dear *${userName}*,

Loan ID: *${loanId || "-"}*
We have successfully received your repayment amount: *₹${plain(repaymentAmount)}*.
Your current available limit: *₹${plain(currentLimit)}*.

Thank you very much for choosing SDL.

Regards,
SDL Team 🪔`, appUrl);
}

export function loanRejectedMessage(userName, amount, reason, loanId, appUrl) {
  return withAppUrl(`🪔 *Loan Rejected* 🙏

Dear *${userName}*,

Loan ID: *${loanId || "-"}*
We regret to inform you that your loan application of *₹${plain(amount)}* has been rejected.

Reason: *${reason}*

Please contact SDL support if you have any questions.

Thank you very much for choosing SDL.

Regards,
SDL Team 🪔`, appUrl);
}

export function repaymentReminderMessage(userName, loanAmount, repaymentAmount, repaymentDate, loanId, appUrl) {
  return withAppUrl(`🪔 *Repayment Reminder* 🙏

Dear *${userName}*,

This is a friendly reminder that your loan repayment is due *tomorrow*.

Loan ID: *${loanId || "-"}*
Loan Amount: *₹${plain(loanAmount)}*
Repayment Amount: *₹${plain(repaymentAmount)}*
Repayment Date: *${repaymentDate}*

Please ensure timely repayment to avoid overdue charges.

Thank you very much for choosing SDL.

Regards,
SDL Team 🪔`, appUrl);
}