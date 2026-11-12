import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    // Referral downline is keyed by the server-resolved referrer id recorded at
    // KYC time (never by a client-supplied mobile number).
    if (!user.id) return Response.json({ friends: [], loans: [] });

    const friends = await base44.asServiceRole.entities.User.filter({ referrer_id: user.id });

    const loans = [];
    for (const f of friends) {
      const fls = await base44.asServiceRole.entities.LoanApplication.filter({ user_id: f.id }, '-created_date');
      for (const l of fls) {
        loans.push({
          id: l.id,
          friendName: f.display_name || f.full_name || '',
          friendMobile: f.mobile_number || '',
          friendPic: f.profile_picture || '',
          amount: l.amount,
          repayment_amount: l.repayment_amount,
          due_date: l.due_date,
          status: l.status,
        });
      }
    }

    return Response.json({
      friends: friends.map((f) => ({
        name: f.display_name || f.full_name || '',
        mobile: f.mobile_number || '',
        pic: f.profile_picture || '',
        kyc_status: f.kyc_status || '',
      })),
      loans,
    });
  } catch (error) {
    return Response.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}