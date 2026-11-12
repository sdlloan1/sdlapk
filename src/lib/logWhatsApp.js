import { base44 } from "@/api/base44Client";

// Best-effort storage of a system-generated WhatsApp message so the admin can
// review / copy it later. Never throws — logging must not break the action.
export async function logWhatsApp({ user_id, user_name, user_mobile, loan_id, message_type, message }) {
  try {
    await base44.entities.WhatsAppLog.create({
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