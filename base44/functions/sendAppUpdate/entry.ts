import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

// Publishes a new app version and delivers an update notification to every app user.
export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const version = String(body.version || '').trim();
    const downloadUrl = String(body.download_url || '').trim();
    const notes = String(body.notes || '').trim();
    const reminderDays = [1, 2].includes(Number(body.reminder_days)) ? Number(body.reminder_days) : 2;

    if (!version) return Response.json({ error: 'Add the updated version.' }, { status: 400 });
    if (version.length > 40) return Response.json({ error: 'Version is too long.' }, { status: 400 });
    if (!/^https?:\/\/\S+$/i.test(downloadUrl)) {
      return Response.json({ error: 'Paste a valid download link starting with http:// or https://' }, { status: 400 });
    }
    if (notes.length > 500) return Response.json({ error: 'Notes are too long (max 500 characters).' }, { status: 400 });

    // Only the newest update is active; older ones stay in the history.
    await base44.asServiceRole.entities.AppUpdate.updateMany({ is_active: true }, { $set: { is_active: false } });

    // Only users who installed the SDL app see the popup, so count those.
    const userCount = await base44.asServiceRole.entities.User.count({ role: 'user', app_installed: true }).catch(() => 0);

    // No notification is created: users see the update as an in-app popup when they open the app.
    const update = await base44.asServiceRole.entities.AppUpdate.create({
      version,
      download_url: downloadUrl,
      notes,
      reminder_days: reminderDays,
      is_active: true,
      sent_at: new Date().toISOString(),
      sent_count: userCount,
    });

    return Response.json({ update, notified: userCount });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
