import pg from 'pg';
import dotenv from 'dotenv';
import { Signer } from '@aws-sdk/rds-signer';

dotenv.config();

const { Pool } = pg;

const host = process.env.AWS_RDS_HOST || 'database-1.cluster-cvwo02ecys5c.ap-south-2.rds.amazonaws.com';
const port = parseInt(process.env.AWS_RDS_PORT || '5432', 10);
const database = process.env.AWS_RDS_DATABASE || 'postgres';
const user = process.env.AWS_RDS_USER || 'postgres';
const password = process.env.AWS_RDS_PASSWORD || '';
const region = process.env.AWS_REGION || 'ap-south-2';
const sslMode = process.env.AWS_RDS_SSL !== 'false';

async function checkTables() {
  console.log('🔍 Connecting to AWS Aurora RDS PostgreSQL...');
  let cleanPass = password;
  if (cleanPass.includes('Action=connect')) {
    cleanPass = cleanPass.substring(cleanPass.indexOf('Action=connect'));
  }

  if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
    try {
      const signer = new Signer({ hostname: host, port, username: user, region });
      cleanPass = await signer.getAuthToken();
    } catch (e) {
      console.warn('IAM Token Generation note:', e.message);
    }
  }

  const pool = new Pool({
    host,
    port,
    database,
    user,
    password: cleanPass,
    ssl: sslMode ? { rejectUnauthorized: false } : false,
    connectionTimeoutMillis: 10000
  });

  try {
    const client = await pool.connect();
    console.log('✅ Connected to database successfully!');

    // 1. List all public tables
    const resTables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);

    console.log('\n========================================');
    console.log(`📋 AWS Aurora RDS Tables (${resTables.rows.length} Total):`);
    console.log('========================================');

    for (const row of resTables.rows) {
      const tName = row.table_name;
      try {
        const countRes = await client.query(`SELECT count(*) FROM "${tName}";`);
        const count = countRes.rows[0].count;
        console.log(` • Table: ${tName.padEnd(25)} | Rows: ${count}`);
      } catch (err) {
        console.log(` • Table: ${tName.padEnd(25)} | Error: ${err.message}`);
      }
    }

    client.release();
    await pool.end();
  } catch (err) {
    console.error('❌ Connection Failed:', err.message);
    console.log('\n💡 Note: Make sure your AWS RDS Security Group allows inbound PostgreSQL traffic (Port 5432) from your IP.');
  }
}

checkTables();
