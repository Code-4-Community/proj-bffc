/**
 * Origin of an event in the admin aggregate list.
 * `luma` = staff-managed, Luma-linked (`admin_events`).
 * `steward` = published by a site steward (`steward_events`).
 */
export enum EventSourceType {
  LUMA = 'luma',
  STEWARD = 'steward',
}
