const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

const PLATFORMS = ['web', 'android', 'ios'];

// Public page-view beacon. Called from the web app and the Android WebView, so
// it must not require a signed-in user; writes go through the service role.
export default async function (req: Request): Promise<Response> {
  try {
    createClientFromRequest(req);

    const body = await req.json().catch(() => ({}));
    const page = String(body?.page || '').slice(0, 200);
    if (!page) return Response.json({ error: 'page required' }, { status: 400 });

    const user = await db.auth.me().catch(() => null);

    await db.asServiceRole.entities.AppEvent.create({
      page,
      platform: PLATFORMS.includes(body?.platform) ? body.platform : 'web',
      session_id: String(body?.session_id || '').slice(0, 80),
      user_id: user?.id || '',
      user_agent: (req.headers.get('user-agent') || '').slice(0, 300),
    });

    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ ok: false, error: error.message || 'Server error' }, { status: 500 });
  }
}
