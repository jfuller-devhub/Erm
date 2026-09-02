/**
 * Bidirectional sync helpers for the Vendor ↔ Plan many-to-many relationship.
 *
 * Vendors live in AppContext (in-memory) and carry a planIds[] array.
 * Plans live in localStorage via loadPlans/savePlans and carry a vendorIds[] array.
 *
 * When a vendor's planIds change  → update the affected plans' vendorIds in localStorage.
 * When a plan's vendorIds change  → call updateVendor() for each affected vendor in AppContext.
 */

import { loadPlans, savePlans } from './planData';

// ─── Vendor → Plans ───────────────────────────────────────────────────────────

/**
 * Called after a vendor is created or updated.
 * Keeps the vendorIds arrays on the affected Plans in localStorage in sync.
 */
export function syncVendorPlanLinks(
  vendorId: string,
  newPlanIds: string[],
  oldPlanIds: string[]
): void {
  const added   = newPlanIds.filter(id => !oldPlanIds.includes(id));
  const removed = oldPlanIds.filter(id => !newPlanIds.includes(id));

  if (added.length === 0 && removed.length === 0) return;

  const plans = loadPlans();
  const updated = plans.map(p => {
    if (added.includes(p.id) && !p.vendorIds.includes(vendorId)) {
      return { ...p, vendorIds: [...p.vendorIds, vendorId] };
    }
    if (removed.includes(p.id)) {
      return { ...p, vendorIds: p.vendorIds.filter(id => id !== vendorId) };
    }
    return p;
  });
  savePlans(updated);
}

/**
 * Called when a vendor is deleted.
 * Removes the vendorId from every plan's vendorIds array in localStorage.
 */
export function removeVendorFromAllPlans(vendorId: string): void {
  const plans = loadPlans();
  const updated = plans.map(p => ({
    ...p,
    vendorIds: p.vendorIds.filter(id => id !== vendorId),
  }));
  savePlans(updated);
}

// ─── Plan → Vendors ───────────────────────────────────────────────────────────

/**
 * Called after a plan's vendorIds change (e.g. from PlanDetail or PlanFormModal).
 * Updates the planIds field on the relevant vendors via AppContext's updateVendor.
 */
export function syncVendorPlanLinksFromPlan(
  planId: string,
  newVendorIds: string[],
  oldVendorIds: string[],
  vendors: Array<{ id: string; planIds: string[] }>,
  updateVendor: (id: string, changes: { planIds: string[] }) => void
): void {
  const added   = newVendorIds.filter(id => !oldVendorIds.includes(id));
  const removed = oldVendorIds.filter(id => !newVendorIds.includes(id));

  for (const vid of added) {
    const vendor = vendors.find(v => v.id === vid);
    if (vendor && !vendor.planIds.includes(planId)) {
      updateVendor(vid, { planIds: [...vendor.planIds, planId] });
    }
  }
  for (const vid of removed) {
    const vendor = vendors.find(v => v.id === vid);
    if (vendor) {
      updateVendor(vid, { planIds: vendor.planIds.filter(id => id !== planId) });
    }
  }
}
