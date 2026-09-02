/**
 * Migration utility to update checklist associations from legacy format to new format
 * Run this once to migrate existing data in localStorage
 */

import type { VendorLevelChecklistAssociation } from './checklistData';

const ASSOCIATIONS_STORAGE_KEY = 'erm_vendor_level_checklist_associations_v3';

export function migrateChecklistAssociations(): void {
  const stored = localStorage.getItem(ASSOCIATIONS_STORAGE_KEY);
  if (!stored) {
    console.log('[Migration] No associations found in localStorage');
    return;
  }

  try {
    const associations: VendorLevelChecklistAssociation[] = JSON.parse(stored);
    let migrationCount = 0;

    const migrated = associations.map(assoc => {
      // If already has vendorStatusAssignments, no migration needed
      if (assoc.vendorStatusAssignments && Object.keys(assoc.vendorStatusAssignments).length > 0) {
        return assoc;
      }

      // Migrate from legacy format
      if (assoc.vendorStatuses && assoc.vendorStatuses.length > 0) {
        migrationCount++;
        const vendorStatusAssignments: Record<string, 'required' | 'optional'> = {};
        assoc.vendorStatuses.forEach(status => {
          vendorStatusAssignments[status] = assoc.status;
        });

        return {
          ...assoc,
          vendorStatusAssignments,
        };
      }

      return assoc;
    });

    if (migrationCount > 0) {
      localStorage.setItem(ASSOCIATIONS_STORAGE_KEY, JSON.stringify(migrated));
      console.log(`[Migration] Successfully migrated ${migrationCount} checklist associations`);
    } else {
      console.log('[Migration] No associations needed migration');
    }
  } catch (error) {
    console.error('[Migration] Error migrating checklist associations:', error);
  }
}

// Auto-run migration on import
migrateChecklistAssociations();
