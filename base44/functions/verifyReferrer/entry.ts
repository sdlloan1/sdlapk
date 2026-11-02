const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// Demo number used in old test data — must never work as a referrer.
const BLOCKED_MOBILE = '7894561237';

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await db.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const mobile = String(body?.mobile_number || '').trim();

    if (!/^\d{10}$/.test(mobile)) {
      return Response.json({ found: false, error: 'Invalid mobile number' }, { status: 400 });
    }
    if (mobile === String(user.mobile_number || '')) {
      return Response.json({ found: false, error: 'Referrer cannot be yourself' });
    }
    if (BLOCKED_MOBILE === mobile) {
      return Response.json({ found: false, error: 'This number cannot be used as a referrer' });
    }

    const referrers = await db.asServiceRole.entities.User.filter({ mobile_number: mobile });
    if (referrers && referrers.length > 0) {
      const r = referrers[0];
      return Response.json({ found: true, name: r.display_name || r.full_name || '' });
    }
    return Response.json({ found: false });
  } catch (error) {
    return Response.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}