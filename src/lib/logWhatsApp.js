const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };


// Best-effort storage of a system-generated WhatsApp message so the admin can
// review / copy it later. Never throws — logging must not break the action.
export async function logWhatsApp({ user_id, user_name, user_mobile, loan_id, message_type, message }) {
  try {
    await db.entities.WhatsAppLog.create({
      user_id: user_id || "",
      user_name: user_name || "",
      user_mobile: user_mobile || "",
      loan_id: loan_id || "",
      message_type,
      message,
    });
  } catch (e) {
    // silent
  }
}