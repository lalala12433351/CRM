import { getAwsClient } from '../src/lib/awsDb.js';

async function checkAdLeads() {
  try {
    const pool = await getAwsClient();
    const client = await pool.connect();
    
    const countRes = await client.query('SELECT count(*) FROM leads;');
    const adRes = await client.query(`
      SELECT id, name, phone, email, source, status, assignee_name, created_at 
      FROM leads 
      WHERE source LIKE '%Facebook%' OR source LIKE '%Google%' OR source LIKE '%Sync%' OR source LIKE '%Ads%'
      ORDER BY created_at DESC;
    `);

    console.log('========================================');
    console.log('📊 AWS Aurora RDS Ad Synced Leads Summary');
    console.log('========================================');
    console.log('Total Leads in Database:', countRes.rows[0].count);
    console.log('Ad Synced Leads Count:', adRes.rows.length);
    console.log('\nLatest Ad Leads Synced:');
    console.table(adRes.rows.map(r => ({
      ID: r.id,
      Name: r.name,
      Phone: r.phone,
      Source: r.source,
      Status: r.status,
      Assignee: r.assignee_name,
      Created: r.created_at
    })));

    client.release();
    await pool.end();
  } catch (err) {
    console.error('Error checking leads:', err.message);
  }
}

checkAdLeads();
