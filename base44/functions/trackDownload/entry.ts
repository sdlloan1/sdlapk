const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

const PLATFORMS = ['android', 'ios', 'pwa'];

// Counts one APK/AAB download. Fired from the download page and the download
// modal before the file is served, so it works for signed-out visitors too.
export default async function (req: Request): Promise<Response> {
  try {
    createClientFromRequest(req);

    const body = await req.json().catch(() => ({}));
    const user = await db.auth.me().catch(() => null);

    await db.asServiceRole.entities.AppDownload.create({
      platform: PLATFORMS.includes(body?.platform) ? body.platform : 'android',
      source: String(body?.source || 'download_page').slice(0, 60),
      file_name: String(body?.file_name || '').slice(0, 120),
      referrer: String(body?.referrer || req.headers.get('referer') || '').slice(0, 300),
      user_id: user?.id || '',
      user_agent: (req.headers.get('user-agent') || '').slice(0, 300),
    });

    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ ok: false, error: error.message || 'Server error' }, { status: 500 });
  }
}
