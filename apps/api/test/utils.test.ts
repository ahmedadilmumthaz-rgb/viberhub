import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  normalizePhoneToE164,
  isValidE164,
  renderTemplate,
  ALLOWED_TEMPLATE_VARIABLES
} from '@viberhub/shared';

describe('Shared Utilities', () => {
  describe('Phone Normalization', () => {
    it('normalizes international format with plus', () => {
      assert.strictEqual(normalizePhoneToE164('+44 7911 123456'), '+447911123456');
      assert.strictEqual(normalizePhoneToE164('+1 (415) 555-0199'), '+14155550199');
    });

    it('normalizes local 10-digit number with default country code', () => {
      assert.strictEqual(normalizePhoneToE164('4155550199', '1'), '+14155550199');
    });

    it('converts leading 00 to plus', () => {
      assert.strictEqual(normalizePhoneToE164('00447911123456'), '+447911123456');
    });

    it('validates E.164 format correctly', () => {
      assert.strictEqual(isValidE164('+14155550199'), true);
      assert.strictEqual(isValidE164('+447911123456'), true);
      assert.strictEqual(isValidE164('14155550199'), false); // missing plus
      assert.strictEqual(isValidE164('+012345'), false); // invalid starting digit
    });
  });

  describe('Template Variable Interpolation', () => {
    it('interpolates allowed variables {{name}}, {{phone}}, {{company}}, {{date}}', () => {
      const template = 'Hello {{name}} from {{company}}! We will call {{phone}} on {{date}}.';
      const context = {
        name: 'Sarah Connor',
        company: 'Cyberdyne',
        phone: '+15550199',
        date: '2026-11-16'
      };

      const result = renderTemplate(template, context);
      assert.strictEqual(
        result.renderedText,
        'Hello Sarah Connor from Cyberdyne! We will call +15550199 on 2026-11-16.'
      );
      assert.strictEqual(result.missingVariables.length, 0);
      assert.strictEqual(result.invalidVariables.length, 0);
    });

    it('flags unapproved variables as invalidVariables', () => {
      const template = 'Hello {{name}}, your balance is {{secret_token}} and {{account_balance}}';
      const result = renderTemplate(template, { name: 'Alice' });

      assert.deepStrictEqual(result.invalidVariables, ['secret_token', 'account_balance']);
      assert.strictEqual(result.renderedText.includes('{{secret_token}}'), true);
    });

    it('flags missing variables with warnings without crashing', () => {
      const template = 'Hello {{name}}, your company {{company}} has a meeting on {{date}}.';
      const result = renderTemplate(template, { name: 'Bob' }); // company and date missing

      assert.strictEqual(result.missingVariables.includes('company'), true);
      assert.strictEqual(result.missingVariables.includes('date'), true);
      assert.strictEqual(result.renderedText.includes('Bob'), true);
    });

    it('escapes HTML tags to prevent XSS injection', () => {
      const template = 'Message: {{name}}';
      const result = renderTemplate(template, { name: '<script>alert(1)</script>' });
      assert.strictEqual(result.renderedText, 'Message: &lt;script&gt;alert(1)&lt;/script&gt;');
    });
  });
});
