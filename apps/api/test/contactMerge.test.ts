import { describe, it } from 'node:test';
import assert from 'node:assert';
import { ContactService } from '../src/services/contactService.js';
import { DestinationService } from '../src/services/destinationService.js';
import { CampaignService } from '../src/services/campaignService.js';
import { db } from '../src/db/store.js';
import { DestinationType, ConsentStatus } from '@viberhub/shared';

describe('Contact Merge Service', () => {
  const workspaceId = '11111111-1111-1111-1111-111111111111';
  const userId = '00000000-0000-0000-0000-000000000001';

  it('rejects merging a contact into itself', async () => {
    await assert.rejects(async () => {
      await ContactService.mergeContacts(workspaceId, 'c1', 'c1', userId);
    }, /Cannot merge a contact into itself/);
  });

  it('rejects merging non-existent contacts', async () => {
    await assert.rejects(async () => {
      await ContactService.mergeContacts(workspaceId, 'non-existent-1', 'non-existent-2', userId);
    }, /Primary contact not found/);
  });

  it('successfully merges duplicate contact, tags, destinations, and campaign items into primary', async () => {
    // 1. Create Primary Contact
    const primary = await ContactService.createContact(workspaceId, userId, {
      displayName: 'Primary Contact',
      phoneOriginal: '+14155558801',
      notes: 'Primary initial notes'
    });

    // 2. Create Duplicate Contact
    const duplicate = await ContactService.createContact(workspaceId, userId, {
      displayName: 'Duplicate Contact',
      phoneOriginal: '+14155558802',
      email: 'duplicate@domain.com',
      organization: 'Target Corp',
      notes: 'Duplicate supplementary notes'
    });

    // 3. Create Tags & Assign
    const tag1Id = 'tag-merge-1';
    const tag2Id = 'tag-merge-2';
    db.data.tags.set(tag1Id, {
      id: tag1Id,
      workspaceId,
      name: 'Shared Tag',
      color: '#3b82f6',
      archivedAt: null,
      createdAt: new Date().toISOString()
    });
    db.data.tags.set(tag2Id, {
      id: tag2Id,
      workspaceId,
      name: 'Duplicate Specific Tag',
      color: '#10b981',
      archivedAt: null,
      createdAt: new Date().toISOString()
    });

    // Primary has tag1; Duplicate has tag1 and tag2
    db.data.contactTags.set(`${primary.id}_${tag1Id}`, { contactId: primary.id, tagId: tag1Id });
    db.data.contactTags.set(`${duplicate.id}_${tag1Id}`, { contactId: duplicate.id, tagId: tag1Id });
    db.data.contactTags.set(`${duplicate.id}_${tag2Id}`, { contactId: duplicate.id, tagId: tag2Id });

    // 4. Create Destination pointing to Duplicate
    const dest = await DestinationService.createDestination(workspaceId, {
      contactId: duplicate.id,
      type: DestinationType.INDIVIDUAL_CHAT,
      displayName: duplicate.displayName
    });

    // 5. Create Consent record for Duplicate
    const consent = await ContactService.recordConsent(workspaceId, duplicate.id, userId, {
      status: ConsentStatus.EXPLICIT_OPT_IN,
      purpose: 'Marketing SMS and Viber updates',
      proofReference: 'Form #9981'
    });

    // 6. Create Campaign with Item pointing to Duplicate
    const campaign = await CampaignService.createCampaign(workspaceId, userId, {
      title: 'Merge Campaign Test',
      items: [
        {
          destinationId: dest.id,
          body: 'Hello from merge test'
        }
      ]
    });
    // Manually ensure item references duplicate contactId in store
    const item = Array.from(db.data.campaignItems.values()).find((ci) => ci.campaignId === campaign.id);
    assert.ok(item, 'Campaign item must exist');
    item.contactId = duplicate.id;

    // 7. Execute Merge
    const merged = await ContactService.mergeContacts(workspaceId, primary.id, duplicate.id, userId);

    // 8. Assertions on Primary Contact
    assert.strictEqual(merged.id, primary.id);
    assert.strictEqual(merged.displayName, 'Primary Contact');
    assert.strictEqual(merged.email, 'duplicate@domain.com', 'Primary should inherit missing email');
    assert.strictEqual(merged.organization, 'Target Corp', 'Primary should inherit missing organization');
    assert.ok(merged.notes?.includes('Primary initial notes'), 'Primary notes preserved');
    assert.ok(merged.notes?.includes('Duplicate supplementary notes'), 'Duplicate notes appended');
    assert.strictEqual(merged.tags.length, 2, 'Primary should now have both tag1 and tag2');

    // 9. Assertions on Duplicate Contact
    const archivedDuplicate = db.data.contacts.get(duplicate.id);
    assert.ok(archivedDuplicate.archivedAt !== null, 'Duplicate must be archived');
    assert.ok(archivedDuplicate.notes.includes('[ARCHIVED - Merged into contact'), 'Duplicate notes audit trail');

    // 10. Assertions on Destinations & Consent
    const updatedDest = db.data.destinations.get(dest.id);
    assert.strictEqual(updatedDest.contactId, primary.id, 'Destination contactId must point to primary');

    const updatedConsent = db.data.consentRecords.get(consent.id);
    assert.strictEqual(updatedConsent.contactId, primary.id, 'Consent record contactId must point to primary');

    // 11. Assertions on Campaign Item
    const updatedItem = db.data.campaignItems.get(item.id);
    assert.strictEqual(updatedItem.contactId, primary.id, 'Campaign item contactId must point to primary');
  });
});
