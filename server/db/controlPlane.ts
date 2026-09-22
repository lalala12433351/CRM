/**
 * Control-plane helpers (pixbe_control).
 * Membership / tenant directory lives here — not in workspace CRM DBs.
 */
export {
  getControlPool,
  migrateControlPlane,
  CONTROL_DB_NAME
} from './tenantPool';
export {
  provisionTenant,
  upsertMembership,
  deleteMembership,
  listControlTenants,
  upsertFacebookPageIndex,
  deleteFacebookPageIndex,
  findMembershipsByCognitoSub,
  findMembershipsByEmail,
  bindCognitoSubToMembership
} from './provisionTenant';
export type { ControlMembership } from './provisionTenant';
