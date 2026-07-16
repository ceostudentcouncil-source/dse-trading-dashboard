import { fsGet, fsSet, fsGetAll, fsDelete } from "../firebase.js";

// The one email that can never be removed via the dashboard — prevents
// a misclick from locking everyone (including the owner) out of admin.
export const SUPER_ADMIN_EMAIL = "ceostudentcouncil@gmail.com";

// ══════════════════════════════════════════════════════════════
// ADMIN SERVICE — Dynamic, Firestore-backed
// Replaces the old static SUB_ADMIN_EMAILS array (#6 fix).
// Admins now live in the `admins/{email}` collection and can be
// added/removed live from the Admin Dashboard, no code deploy needed.
//
// Document shape:  admins/{email} = { role: "full" | "limited", addedAt, addedBy }
// ══════════════════════════════════════════════════════════════

// Check whether a given email is a registered admin.
// Returns the admin doc ({role, addedAt, addedBy}) or null.
export async function getAdminRecord(email) {
  if (!email) return null;
  return await fsGet("admins/" + email);
}

// Convenience boolean check — used at login / route-guard time.
export async function checkIsAdmin(email) {
  const rec = await getAdminRecord(email);
  return !!rec;
}

// List every admin currently registered (for the Permissions tab).
export async function listAdmins() {
  return await fsGetAll("admins");
}

// Add a new admin (or update an existing one's role).
// addedBy = email of the admin performing the action, for audit trail.
export async function addAdmin(email, role, addedBy) {
  if (!email) return false;
  const clean = email.trim().toLowerCase();
  return await fsSet("admins/" + clean, {
    role: role || "limited",
    addedBy: addedBy || "unknown",
    addedAt: new Date().toISOString().split("T")[0],
  });
}

// Remove an admin's access entirely. The Firestore rule checks
// document *existence*, so this must be a real delete — not a
// soft-flag update — otherwise the removed admin would keep access.
// The super admin is protected from accidental removal.
export async function revokeAdmin(email) {
  if (!email) return false;
  const clean = email.trim().toLowerCase();
  if (clean === SUPER_ADMIN_EMAIL) {
    return { ok: false, reason: "super_admin_protected" };
  }
  const ok = await fsDelete("admins/" + clean);
  return { ok };
}
