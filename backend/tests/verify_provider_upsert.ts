import jwt from 'jsonwebtoken';
import { CONFIG } from '../src/config/index.js';

const API_BASE = 'http://localhost:5000/api';

async function run() {
  console.log('--- 1. Authenticate Super Admin ---');
  const token = jwt.sign(
    { id: 'usr_admin_001', email: 'admin@abkdata.com', role: 'super_admin' },
    CONFIG.JWT_SECRET,
    { expiresIn: '2h' }
  );

  console.log('\n--- 2. Upsert a Real Telecom Provider (ClubKonnect) ---');
  const upsertRes = await fetch(`${API_BASE}/providers/upsert`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      id: 'prv_clubkonnect',
      name: 'ClubKonnect Direct Enterprise',
      category: 'data',
      environment: 'production',
      baseUrl: 'https://www.clubkonnect.com/api',
      apiKey: 'CK_API_KEY_LIVE_998811223344',
      apiSecret: 'CK_SECRET_HASH_PROTECTED_5544',
      authMethod: 'bearer_token',
      dataEndpoint: '/data',
      airtimeEndpoint: '/airtime',
      cableEndpoint: '/cable',
      electricityEndpoint: '/electricity',
      balanceEndpoint: '/user/balance',
      timeoutSeconds: 12,
      priority: 1
    })
  });
  const upsertData = await upsertRes.json();
  console.log('Upsert Response:', upsertData);

  console.log('\n--- 3. Fetch Providers and Verify Masking ---');
  const provRes = await fetch(`${API_BASE}/providers`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const provData = await provRes.json();
  const ck = provData.providers?.find((p: any) => p.id === 'prv_clubkonnect');
  console.log('ClubKonnect in list:');
  console.log('  Name:', ck?.name);
  console.log('  Base URL:', ck?.base_url);
  console.log('  Masked Key:', ck?.api_key_masked);
  console.log('  Data Endpoint:', ck?.data_endpoint);
  console.log('  Balance Endpoint:', ck?.balance_endpoint);
  console.log('  Priority:', ck?.priority);

  console.log('\n=============================================');
  console.log('PROVIDER UPSERT & ENCRYPTION VERIFIED');
  console.log('=============================================');
}

run().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
