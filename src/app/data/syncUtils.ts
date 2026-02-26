/**
 * Bidirectional sync helpers for the Vendor ↔ Product many-to-many relationship.
 *
 * Vendors live in AppContext (in-memory).
 * Products live in localStorage via loadProducts/saveProducts.
 *
 * When a vendor's productIds change → update the affected products' vendorIds in localStorage.
 * When a product's vendorIds change → call updateVendor() for each affected vendor in AppContext.
 */

import { loadProducts, saveProducts } from './productData';

// ─── Vendor → Products ────────────────────────────────────────────────────────

/**
 * Called after a vendor is created or updated.
 * Updates the `vendorIds` field of the relevant products in localStorage.
 *
 * @param vendorId     The vendor whose productIds changed.
 * @param newProductIds The vendor's productIds after the change.
 * @param oldProductIds The vendor's productIds before the change ([] for new vendors).
 */
export function syncVendorProductLinks(
  vendorId: string,
  newProductIds: string[],
  oldProductIds: string[]
): void {
  const added   = newProductIds.filter(id => !oldProductIds.includes(id));
  const removed = oldProductIds.filter(id => !newProductIds.includes(id));

  if (added.length === 0 && removed.length === 0) return;

  const products = loadProducts();
  const updated = products.map(p => {
    if (added.includes(p.id) && !p.vendorIds.includes(vendorId)) {
      return { ...p, vendorIds: [...p.vendorIds, vendorId] };
    }
    if (removed.includes(p.id)) {
      return { ...p, vendorIds: p.vendorIds.filter(id => id !== vendorId) };
    }
    return p;
  });
  saveProducts(updated);
}

/**
 * Called when a vendor is deleted.
 * Removes the vendorId from every product's vendorIds array in localStorage.
 */
export function removeVendorFromAllProducts(vendorId: string): void {
  const products = loadProducts();
  const updated = products.map(p => ({
    ...p,
    vendorIds: p.vendorIds.filter(id => id !== vendorId),
  }));
  saveProducts(updated);
}

// ─── Product → Vendors ────────────────────────────────────────────────────────

/**
 * Called after a product is created or updated.
 * Updates the `productIds` field of the relevant vendors via AppContext's updateVendor.
 *
 * @param productId     The product whose vendorIds changed.
 * @param newVendorIds  The product's vendorIds after the change.
 * @param oldVendorIds  The product's vendorIds before the change ([] for new products).
 * @param vendors       Current vendors array from AppContext.
 * @param updateVendor  AppContext updateVendor function.
 */
export function syncProductVendorLinks(
  productId: string,
  newVendorIds: string[],
  oldVendorIds: string[],
  vendors: Array<{ id: string; productIds: string[] }>,
  updateVendor: (id: string, changes: { productIds: string[] }) => void
): void {
  const added   = newVendorIds.filter(id => !oldVendorIds.includes(id));
  const removed = oldVendorIds.filter(id => !newVendorIds.includes(id));

  for (const vid of added) {
    const vendor = vendors.find(v => v.id === vid);
    if (vendor && !vendor.productIds.includes(productId)) {
      updateVendor(vid, { productIds: [...vendor.productIds, productId] });
    }
  }
  for (const vid of removed) {
    const vendor = vendors.find(v => v.id === vid);
    if (vendor) {
      updateVendor(vid, { productIds: vendor.productIds.filter(id => id !== productId) });
    }
  }
}

/**
 * Called when a product is deleted.
 * Removes the productId from every vendor's productIds array via AppContext.
 */
export function removeProductFromAllVendors(
  productId: string,
  vendors: Array<{ id: string; productIds: string[] }>,
  updateVendor: (id: string, changes: { productIds: string[] }) => void
): void {
  for (const vendor of vendors) {
    if (vendor.productIds.includes(productId)) {
      updateVendor(vendor.id, {
        productIds: vendor.productIds.filter(id => id !== productId),
      });
    }
  }
}
