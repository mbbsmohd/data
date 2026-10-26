import { SURITY_RULES, runSurityDiagnosticAudit, SurityValidator } from '../security/SurityValidationEngine.js';
import { db } from '../database/index.js';

async function runSurityTests() {
  console.log('🛡️ Running 105+ Surity Security, Validation & Authentication Test Suite...\n');
  let passCount = 0;
  let failCount = 0;

  function assert(condition: boolean, msg: string) {
    if (condition) {
      console.log(`  ✅ PASS: ${msg}`);
      passCount++;
    } else {
      console.error(`  ❌ FAIL: ${msg}`);
      failCount++;
    }
  }

  try {
    // 1. Rule Catalog Count Verification
    console.log('1. Verifying 105 Enterprise Rule Inventory...');
    assert(SURITY_RULES.length >= 105, `Surity Rules Engine loaded ${SURITY_RULES.length} rules (Expected >= 105)`);

    // Verify all 10 Security Domains are represented
    const categories = new Set(SURITY_RULES.map(r => r.category));
    console.log('Registered Domains:', Array.from(categories));
    const expectedDomains = [
      'IDENTITY_AUTH',
      'TELECOM_MSISDN',
      'FINANCIAL_LEDGER',
      'BANKING_NUBAN',
      'KYC_AML',
      'GATEWAY_WEBHOOK',
      'RATE_LIMIT_BRUTE_FORCE',
      'INJECTION_SANITIZATION',
      'AUDIT_INCIDENT',
      'FAILOVER_RECONCILIATION'
    ];
    for (const dom of expectedDomains) {
      assert(categories.has(dom as any), `Security domain [${dom}] is registered and active`);
    }

    // 2. Full Diagnostic Audit Execution
    console.log('\n2. Executing Automated 105-Rule Diagnostic Audit...');
    const auditReport = runSurityDiagnosticAudit();
    const failedRules = auditReport.results.filter(r => !r.passed);
    if (failedRules.length > 0) {
      console.error('Failed Audit Rules:', failedRules);
    }
    assert(auditReport.totalRules >= 105, `Audit evaluated ${auditReport.totalRules} security rules`);
    assert(auditReport.passedCount === auditReport.totalRules, `All ${auditReport.totalRules} security rules passed with zero exceptions`);
    assert(auditReport.failedCount === 0, `Zero failed checks in audit report`);
    assert(auditReport.score === 100, `Surity Compliance Score is ${auditReport.score}% (A+ Enterprise Grade)`);
    assert(auditReport.status === 'HEALTHY_AND_ENFORCED', `Engine status confirmed as HEALTHY_AND_ENFORCED`);

    // 3. Validator: Email RFC 5322 & Disposable Domain Defense
    console.log('\n3. Testing Surity Email Validation...');
    assert(SurityValidator.validateEmail('user@bukardatasub.com').valid, 'Valid corporate email accepted');
    assert(SurityValidator.validateEmail('chidi.nwosu@gmail.com').valid, 'Valid consumer email accepted');
    assert(!SurityValidator.validateEmail('invalid-email-address').valid, 'Malformed email string rejected');
    assert(!SurityValidator.validateEmail('fraud@mailinator.com').valid, 'Disposable domain @mailinator.com strictly blocked');
    assert(!SurityValidator.validateEmail('spammer@tempmail.com').valid, 'Disposable domain @tempmail.com strictly blocked');

    // 4. Validator: Password Strength Guardrails
    console.log('\n4. Testing Surity Password Validation...');
    assert(SurityValidator.validatePassword('SecurePass#2026').valid, 'Strong password with mixed case, digits & symbols accepted');
    assert(!SurityValidator.validatePassword('short7!').valid, 'Password under 8 characters rejected');
    assert(!SurityValidator.validatePassword('alllowercasewithdigits123').valid, 'Password missing uppercase letters rejected');
    assert(!SurityValidator.validatePassword('ALLUPPERCASEWITHDIGITS123').valid, 'Password missing lowercase letters rejected');
    assert(!SurityValidator.validatePassword('NoDigitsHereAtAll!').valid, 'Password missing numeric digits rejected');
    assert(!SurityValidator.validatePassword('Password123').valid, 'Common weak dictionary password blocked');

    // 5. Validator: 4-Digit Transaction PIN Anti-Pattern Defense
    console.log('\n5. Testing Surity 4-Digit PIN Validation...');
    assert(SurityValidator.validatePin('9382').valid, 'Non-sequential high-entropy PIN (9382) accepted');
    assert(!SurityValidator.validatePin('1234').valid, 'Sequential PIN (1234) rejected');
    assert(!SurityValidator.validatePin('4321').valid, 'Reverse sequential PIN (4321) rejected');
    assert(!SurityValidator.validatePin('0000').valid, 'Repetitive PIN (0000) rejected');
    assert(!SurityValidator.validatePin('1111').valid, 'Repetitive PIN (1111) rejected');
    assert(!SurityValidator.validatePin('12345').valid, 'Non 4-digit PIN rejected');

    // 6. Validator: Telecom MSISDN & Prefix Normalization
    console.log('\n6. Testing Surity MSISDN Telecom Validation...');
    const mtnVal = SurityValidator.validateMsisdn('08031234567');
    assert(mtnVal.valid && mtnVal.normalized === '+2348031234567', 'Nigerian MTN 0803... normalized to +2348031234567');
    const airtelVal = SurityValidator.validateMsisdn('09021234567');
    assert(airtelVal.valid && airtelVal.normalized === '+2349021234567', 'Nigerian Airtel 0902... normalized to +2349021234567');
    assert(!SurityValidator.validateMsisdn('12345').valid, 'Short phone number rejected');
    assert(!SurityValidator.validateMsisdn('+14155552671').valid, 'Non-Nigerian country code (+1 USA) rejected');

    // 7. Validator: Financial Math, Negative & Tier Ceilings
    console.log('\n7. Testing Surity Financial Integrity Math...');
    assert(SurityValidator.validateAmount(500, 1).valid, '₦500.00 within Tier 1 limit accepted');
    assert(!SurityValidator.validateAmount(-100, 1).valid, 'Negative amount rejected');
    assert(!SurityValidator.validateAmount(NaN, 1).valid, 'NaN amount rejected');
    assert(!SurityValidator.validateAmount(Infinity, 1).valid, 'Infinity amount rejected');
    assert(!SurityValidator.validateAmount(20, 1).valid, 'Sub-minimum (₦20 < ₦50) rejected');
    assert(!SurityValidator.validateAmount(100000, 1).valid, 'Amount exceeding Tier 1 ceiling (₦100,000 > ₦50,000) rejected');
    assert(SurityValidator.validateAmount(100000, 2).valid, 'Amount ₦100,000 within Tier 2 ceiling accepted');

    // 8. Validator: Central Bank NUBAN & Bank Codes
    console.log('\n8. Testing Surity NUBAN Bank Account Validation...');
    assert(SurityValidator.validateNuban('0123456789', '058').valid, 'Valid 10-digit NUBAN with GTBank (058) code accepted');
    assert(SurityValidator.validateNuban('5051512345', '50515').valid, 'Valid 10-digit NUBAN with Moniepoint (50515) accepted');
    assert(!SurityValidator.validateNuban('12345', '058').valid, 'NUBAN under 10 digits rejected');
    assert(!SurityValidator.validateNuban('0123456789', '999999').valid, 'Non-existent CBN bank code rejected');

    // 9. Validator: Injection & Payload Sanitization
    console.log('\n9. Testing Surity XSS & Null Byte Sanitization...');
    const dirty = '<script>alert(1)</script>SafeText\0Malicious';
    const clean = SurityValidator.sanitizeString(dirty);
    assert(!clean.includes('<script>') && !clean.includes('\0') && clean.includes('SafeText'), 'XSS tags and null bytes stripped cleanly');

    // 10. Live HTTP API Integration
    console.log('\n10. Testing Live Surity Admin Endpoints...');
    // Authenticate Super Admin
    const loginRes = await fetch('http://127.0.0.1:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: 'admin@abkdata.com', password: 'Admin@Secure2026!' })
    });
    const loginData = await loginRes.json();
    let adminToken = loginData.token;
    if (loginData.require2FA) {
      const otpRow: any = db.prepare("SELECT code FROM otp_verifications WHERE identifier = 'admin@abkdata.com' AND purpose = 'LOGIN_2FA' AND is_used = 0 ORDER BY created_at DESC LIMIT 1").get();
      const otpCode = loginData.devOtpCode || otpRow?.code;
      const verifyRes = await fetch('http://127.0.0.1:5000/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: 'admin@abkdata.com', code: otpCode, purpose: 'LOGIN_2FA' })
      });
      const verifyData = await verifyRes.json();
      adminToken = verifyData.token;
    }
    assert(Boolean(adminToken), 'Super Admin JWT session established for live endpoint tests');

    // GET /api/admin/security/surity-rules
    const rulesRes = await fetch('http://127.0.0.1:5000/api/admin/security/surity-rules', {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const rulesData = await rulesRes.json();
    assert(rulesData.success === true, 'GET /api/admin/security/surity-rules returned success: true');
    assert(rulesData.totalRules >= 105, `GET /api/admin/security/surity-rules returned ${rulesData.totalRules} rules`);
    assert(Object.keys(rulesData.domains).length >= 10, 'Rule domains count >= 10');

    // POST /api/admin/security/surity-audit
    const auditRes = await fetch('http://127.0.0.1:5000/api/admin/security/surity-audit', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const auditApiData = await auditRes.json();
    assert(auditApiData.success === true, 'POST /api/admin/security/surity-audit returned success: true');
    assert(auditApiData.report?.score === 100, `POST /api/admin/security/surity-audit score is ${auditApiData.report?.score}%`);
    assert(auditApiData.report?.passed === auditApiData.report?.totalRules, 'Audit API confirmed all rules passed');

    console.log(`\n========================================`);
    console.log(`🎉 SURITY TEST SUITE COMPLETE: ${passCount} PASSED, ${failCount} FAILED`);
    console.log(`========================================\n`);

    if (failCount > 0) {
      process.exit(1);
    }
  } catch (err: any) {
    console.error('Fatal error during Surity testing:', err);
    process.exit(1);
  }
}

runSurityTests();
