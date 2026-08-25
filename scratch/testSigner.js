import pg from 'pg';
import dotenv from 'dotenv';
import { Signer } from '@aws-sdk/rds-signer';

dotenv.config();

const { Pool } = pg;

const host = process.env.AWS_RDS_HOST || 'database-1.cluster-cvwo02ecys5c.ap-south-2.rds.amazonaws.com';
const port = parseInt(process.env.AWS_RDS_PORT || '5432', 10);
const database = process.env.AWS_RDS_DATABASE || 'postgres';
const user = process.env.AWS_RDS_USER || 'postgres';
const region = process.env.AWS_REGION || 'ap-south-2';

async function testDynamicSigner() {
  console.log(`Generating IAM Auth Token for:`);
  console.log(`Host: ${host}`);
  console.log(`Port: ${port}`);
  console.log(`User: ${user}`);
  console.log(`Region: ${region}`);
  console.log(`Access Key: ${process.env.AWS_ACCESS_KEY_ID ? process.env.AWS_ACCESS_KEY_ID.substring(0, 8) + '...' : 'NONE'}`);

  try {
    const signer = new Signer({
      hostname: host,
      port,
      username: user,
      region,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
      }
    });

    const token = await signer.getAuthToken();
    console.log('\nGenerated Token successfully (length:', token.length, ')');

    console.log('\nAttempting DB connection to Aurora with fresh token...');
    const pool = new Pool({
      host,
      port,
      database,
      user,
      password: token,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 10000
    });

    const client = await pool.connect();
    const res = await client.query('SELECT NOW() as now, current_database() as db, version() as ver');
    console.log('🎉 SUCCESS! Connected to AWS Aurora RDS!');
    console.log('Result:', res.rows[0]);
    client.release();
    await pool.end();
  } catch (err) {
    console.log('❌ DB Connection error:', err.message);
  }
}

testDynamicSigner();
