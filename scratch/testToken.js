import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const { Pool } = pg;

const rawToken = "localhost:5432/?Action=connect&DBUser=postgres&X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=ASIAXAFBAY33IVA332I6%2F20260821%2Feu-north-1%2Frds-db%2Faws4_request&X-Amz-Date=20260821T044538Z&X-Amz-Expires=900&X-Amz-Security-Token=IQoJb3JpZ2luX2VjENX%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEaCmV1LW5vcnRoLTEiRzBFAiBdpexharuju%2BIo4FypIEwNvjDQAq4atj%2FhqM0iSc4%2ByQIhAPo8Ls%2FlOH2BJG1u8bV7zn2dE7uC6WtJyeMxRYop7itHKuECCJ7%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEQABoMNDgxMzc0MDI5NTU4Igw2l1K5IV1F3YKznhEqtQJwZECwjwSbTmkObLNpe9RlJ%2BBg6hMXSChPJccAsL86C6UYy17e2%2FaZR0CjvVUiiy1KB7kIMI3l2mjc%2B2MChgFNx8tgttqPRS3bAdoMOmGjLJAh0LVMT1eIxyqbJt4sweHz%2BeRmTEzA9K%2BwZV8TEdK7TTsMMYskfeqKOoRC2lI%2FVKlY%2F%2FFzfSeBonU4oYjfSGfXbYR6JKYZTVIqF%2BoDYXzLAHNvvLnBz%2FAn3Q0Wqb6r7NWsQXuMzBDiq2uSbMQaAg4wrhNL6Ymnp0tmgv1hdEe2pDxjT4HqJXvMt8h4uapcfxcYEK3qlQVaADE7jS4qZJF6hgAuoqXH1lof5a9PBqNNvzOe0Di%2Fsk326HgnDgtktxz8iN6%2B%2FGEI%2B0cMSNhAqSqPaVd6%2Bu2MZIsaIFNYmuzhvhRA7sIwtaif1AY6rQKyyRN1JLkyJ8s2MRC%2BTdjJmo1nERRa%2BNi7SLYlEMwm7ABm6ovRXNjDJkoDs%2FDE7b%2FHNjekQUeLH6Vx%2FnInMSXPAAbKdUAse1dQfEQ578Y5nLdTjuq0cXkVabjuTfdsIOULzKav21l7irZpmFuxZtjG5tPNM61MSWVT3V34Ha9x2HxMSfV1KMosiSyyDt2APKzVRb5T0v3WrswfpcIx4IEHkoaznG5Mf4QSFwrsel04tdfTYSiYdglTRFHKgdhRoMOYMvQJB%2BGa7uyMEW5AbrVKg3xqCg5VDwjSe0%2BT2tw8ozd8pEnh7aPMtQPyKmPV28fA8jqSABMG1KHQmHn1Oqr%2BagpdjtwHRawm7fcB3EgK45ghvkGI67UwvHd%2FRgV1UEJqL8ElOEf3%2BmPI5H47&X-Amz-Signature=4563cd06e00f5bd36f8d446bc05cb19dbf2fea6096b4e702872222709b75c676&X-Amz-SignedHeaders=host";

let pass = rawToken;
if (pass.includes('Action=connect')) {
  pass = pass.substring(pass.indexOf('Action=connect'));
}

async function testHost(h, label) {
  console.log(`\nTesting connection to: ${label} (${h})...`);
  const pool = new Pool({
    host: h,
    port: 5432,
    database: 'postgres',
    user: 'postgres',
    password: pass,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 5000
  });

  try {
    const client = await pool.connect();
    const res = await client.query('SELECT NOW() as now, current_database() as db, version() as ver');
    console.log(`✅ SUCCESS on ${label}!`);
    console.log('Result:', res.rows[0]);
    client.release();
  } catch (err) {
    console.log(`❌ FAILED on ${label}: ${err.message}`);
  } finally {
    await pool.end();
  }
}

async function run() {
  await testHost('127.0.0.1', 'Localhost IP');
  await testHost('database-1.cluster-cvwo02ecys5c.ap-south-2.rds.amazonaws.com', 'Aurora AWS Cluster');
}

run();
