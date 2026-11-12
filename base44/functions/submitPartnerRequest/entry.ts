import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

// Users request partner status here; approval stays with the admin.
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    if (user.partner_status === "approved") {
      return Response.json({ error: "You are already an SDL partner." }, { status: 400 });
    }
    if (!user.pan_number || !user.upi_id) {
      return Response.json({ error: "Complete your KYC (PAN and UPI) before becoming a partner." }, { status: 400 });
    }

    const existing = await base44.asServiceRole.entities.PartnerRequest.filter({ user_id: user.id });
    if (existing.some((r) => r.status === "pending")) {
      return Response.json({ error: "Your partner request is already under review." }, { status: 400 });
    }

    const address = [user.address_line1, user.address_line2, user.city, user.state, user.pincode]
      .filter(Boolean)
      .join(", ");

    const created = await base44.asServiceRole.entities.PartnerRequest.create({
      user_id: user.id,
      user_name: user.display_name || user.full_name,
      user_mobile: user.mobile_number,
      user_email: user.email,
      user_pan: user.pan_number,
      user_upi_id: user.upi_id,
      user_address: address,
      status: "pending",
    });

    await base44.asServiceRole.entities.User.update(user.id, { partner_status: "pending" });

    return Response.json({ ok: true, id: created.id });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}