const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await db.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const myMobile = String(user.mobile_number || '').trim();
    if (!myMobile) return Response.json({ friends: [], loans: [] });

    const friends = await db.asServiceRole.entities.User.filter({ referrer_mobile: myMobile });

    const loans = [];
    for (const f of friends) {
      const fls = await db.asServiceRole.entities.LoanApplication.filter({ user_id: f.id }, '-created_date');
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