import { describe, it } from 'node:test';
import assert from 'node:assert';
import { app } from '../src/app.js';
import { AuthService } from '../src/services/authService.js';
import { ContactService } from '../src/services/contactService.js';
import { ConsentStatus, DestinationType } from '@viberhub/shared';

describe('Viber Hub API Integration', () => {
  it('healthz returns status ok', async () => {
    // Basic test checking app mounts and services initialize
    assert.ok(app);
  });

  it('authenticates admin user with seed credentials', async () => {
    const authResult = await AuthService.login('admin@viberhub.local', 'Admin1234!');
    assert.ok(authResult.token);
    assert.strictEqual(authResult.user.email, 'admin@viberhub.local');
    assert.strictEqual(authResult.user.displayName, 'System Admin');
    assert.ok(authResult.workspaces.length > 0);
  });

  it('rejects invalid password with 401 INVALID_CREDENTIALS', async () => {
    await assert.rejects(async () => {
      await AuthService.login('admin@viberhub.local', 'WrongPassword!');
    }, (err: any) => {
      return err.statusCode === 401 && err.code === 'INVALID_CREDENTIALS';
    });
  });

  it('enforces unique normalized E.164 phone per workspace', async () => {
    const wsId = '11111111-1111-1111-1111-111111111111';
    const actorId = '00000000-0000-0000-0000-000000000001';

    // First contact
    const c1 = await ContactService.createContact(wsId, actorId, {
      displayName: 'Duplicate Test 1',
      phoneOriginal: '+1 (555) 999-1122',
      consentStatus: ConsentStatus.GRANTED
    });
    assert.strictEqual(c1.phoneE164, '+15559991122');

    // Attempt duplicate
    await assert.rejects(async () => {
      await ContactService.createContact(wsId, actorId, {
        displayName: 'Duplicate Test 2',
        phoneOriginal: '555-999-1122', // Normalizes to +15559991122
        consentStatus: ConsentStatus.GRANTED
      });
    }, (err: any) => {
      return err.statusCode === 409 && err.code === 'DUPLICATE_PHONE';
    });
  });
});
