import pg from 'pg';
import dotenv from 'dotenv';
import { Signer } from '@aws-sdk/rds-signer';
import { 
  INITIAL_LEADS, 
  INITIAL_AGENTS, 
  INITIAL_STAGES, 
  INITIAL_CALL_RECORDS, 
  INITIAL_ACTIVITIES, 
  INITIAL_MESSAGES, 
  INITIAL_TEMPLATES, 
  INITIAL_CAMPAIGNS, 
  INITIAL_WORKFLOWS, 
  INITIAL_CUSTOM_FIELDS, 
  INITIAL_PERMISSION_TEMPLATES 
} from '../data/mockData';

dotenv.config();

const { Pool } = pg;

const host = process.env.AWS_RDS_HOST || 'database-1.cluster-cvwo02ecys5c.ap-south-2.rds.amazonaws.com';
const port = parseInt(process.env.AWS_RDS_PORT || '5432', 10);
const database = process.env.AWS_RDS_DATABASE || 'postgres';
const user = process.env.AWS_RDS_USER || 'postgres';
const password = process.env.AWS_RDS_PASSWORD || '';
const region = process.env.AWS_REGION || 'ap-south-2';
const sslMode = process.env.AWS_RDS_SSL !== 'false';

// Helper to get active password or generate fresh IAM token
export async function getActiveDbPassword(): Promise<string> {
  let cleanPass = password;
  if (cleanPass.includes('Action=connect')) {
    cleanPass = cleanPass.substring(cleanPass.indexOf('Action=connect'));
  }

  // Generate dynamic 15-min IAM token if AWS credentials exist
  if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
    try {
      const signer = new Signer({
        hostname: host,
        port,
        username: user,
        region,
      });
      return await signer.getAuthToken();
    } catch (e: any) {
      console.warn('⚠️ Dynamic IAM token generation failed, falling back to .env password:', e?.message || e);
    }
  }

  return cleanPass;
}

export async function getAwsClient() {
  const currentPassword = await getActiveDbPassword();
  const pool = new Pool({
    host,
    port,
    database,
    user,
    password: currentPassword,
    ssl: sslMode ? { rejectUnauthorized: false } : false,
    connectionTimeoutMillis: 10000,
    idleTimeoutMillis: 30000,
    max: 10,
  });
  return pool;
}

export async function testAwsDbConnection() {
  const hasAwsCredentials = Boolean(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY);
  if (!password && !hasAwsCredentials) {
    return {
      connected: false,
      configured: false,
      message: 'AWS Aurora RDS credentials/token missing in .env.'
    };
  }

  try {
    const pool = await getAwsClient();
    const client = await pool.connect();
    const result = await client.query('SELECT NOW() as now, current_database() as db_name, version() as ver;');
    client.release();
    await pool.end();
    return {
      connected: true,
      configured: true,
      serverTime: result.rows[0].now,
      database: result.rows[0].db_name,
      engine: 'AWS Aurora RDS PostgreSQL (ap-south-2)',
      version: result.rows[0].ver
    };
  } catch (err: any) {
    return {
      connected: false,
      configured: true,
      error: err.message,
      code: err.code,
      host: `${host}:${port}`,
      database,
      user,
      message: err.message.includes('PAM authentication failed')
        ? 'IAM authentication failed. Ensure IAM DB authentication is enabled on your RDS cluster and your IAM user/policy is granted rds-db:connect access.'
        : `Attempted connection to AWS Aurora RDS (${host}:${port}). Check network & security group rules.`
    };
  }
}

export async function initializeAwsDbTables() {
  try {
    const pool = await getAwsClient();
    const client = await pool.connect();

    // Schema Migration: Upgrade legacy tables if present
    await client.query(`
      DO $$
      BEGIN
          IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='permission_templates') AND
             NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='permission_templates' AND column_name='template_name') THEN
              DROP TABLE permission_templates CASCADE;
          END IF;

          IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='agents') AND
             NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='agents' AND column_name='role') THEN
              DROP TABLE agents CASCADE;
          END IF;

          IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='leads') AND
             NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='leads' AND column_name='name') THEN
              DROP TABLE leads CASCADE;
          END IF;

          IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='whatsapp_templates') THEN
              ALTER TABLE whatsapp_templates ALTER COLUMN body_text DROP NOT NULL;
          END IF;
      END $$;
    `);

    // 1. Company Information Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS company_info (
        id VARCHAR(255) PRIMARY KEY,
        company_name VARCHAR(255) NOT NULL,
        details TEXT,
        logo_url TEXT,
        email VARCHAR(255),
        phone VARCHAR(50),
        website VARCHAR(255),
        address TEXT,
        city VARCHAR(100),
        state VARCHAR(100),
        country VARCHAR(100),
        pincode VARCHAR(20),
        gstin VARCHAR(50),
        time_zone VARCHAR(50) DEFAULT 'Asia/Kolkata',
        currency VARCHAR(10) DEFAULT 'INR',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 2. Assignee Details Table (telecallers & leaderboard metrics)
    await client.query(`
      CREATE TABLE IF NOT EXISTS assignees (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255),
        phone VARCHAR(50),
        role VARCHAR(100),
        status VARCHAR(50) DEFAULT 'online',
        avatar_url TEXT,
        permission_template_id VARCHAR(255),
        total_calls_today INT DEFAULT 0,
        talk_time_seconds INT DEFAULT 0,
        converted_leads_count INT DEFAULT 0,
        revenue_generated NUMERIC(15, 2) DEFAULT 0,
        response_time_minutes NUMERIC(10, 2) DEFAULT 0,
        win_rate NUMERIC(5, 2) DEFAULT 0,
        details JSONB DEFAULT '{}'::jsonb,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 3. Pipeline Stages Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS pipeline_stages (
        id VARCHAR(255) PRIMARY KEY,
        stage_name VARCHAR(255) NOT NULL,
        color VARCHAR(50),
        display_order INT DEFAULT 0,
        win_probability INT DEFAULT 0,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 4. Telephone & Call Settings Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS telephone_call_settings (
        id VARCHAR(255) PRIMARY KEY,
        provider_name VARCHAR(100) DEFAULT 'Built-in Power Dialer',
        auto_dialer_enabled BOOLEAN DEFAULT TRUE,
        call_recording_enabled BOOLEAN DEFAULT TRUE,
        local_storage_path VARCHAR(255) DEFAULT '/mobile/storage/call_recordings/',
        dialer_speed VARCHAR(50) DEFAULT '1.5x',
        ring_timeout_seconds INT DEFAULT 30,
        whatsapp_integration_enabled BOOLEAN DEFAULT TRUE,
        sip_server VARCHAR(255),
        api_credentials JSONB DEFAULT '{}'::jsonb,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 5. Custom Field Settings Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS field_settings (
        id VARCHAR(255) PRIMARY KEY,
        field_key VARCHAR(100) NOT NULL,
        field_label VARCHAR(255) NOT NULL,
        field_type VARCHAR(50) NOT NULL,
        category VARCHAR(100) DEFAULT 'General',
        options JSONB DEFAULT '[]'::jsonb,
        is_required BOOLEAN DEFAULT FALSE,
        is_primary BOOLEAN DEFAULT FALSE,
        primary_slot VARCHAR(20),
        display_order INT DEFAULT 0,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 6. Permission Templates Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS permission_templates (
        id VARCHAR(255) PRIMARY KEY,
        template_name VARCHAR(255) NOT NULL,
        description TEXT,
        is_default BOOLEAN DEFAULT FALSE,
        is_root BOOLEAN DEFAULT FALSE,
        rights JSONB NOT NULL DEFAULT '{}'::jsonb,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 7. Follow-Ups Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS follow_ups (
        id VARCHAR(255) PRIMARY KEY,
        lead_id VARCHAR(255),
        lead_name VARCHAR(255),
        lead_phone VARCHAR(50),
        assignee_id VARCHAR(255),
        assignee_name VARCHAR(255),
        follow_up_type VARCHAR(50) DEFAULT 'call',
        scheduled_at TIMESTAMP WITH TIME ZONE,
        status VARCHAR(50) DEFAULT 'Pending',
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 8. Campaigns Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS campaigns (
        id VARCHAR(255) PRIMARY KEY,
        campaign_name VARCHAR(255) NOT NULL,
        campaign_handle VARCHAR(255),
        platform VARCHAR(100),
        status VARCHAR(50) DEFAULT 'Active',
        budget NUMERIC(15, 2) DEFAULT 0,
        spent NUMERIC(15, 2) DEFAULT 0,
        total_leads_generated INT DEFAULT 0,
        qualified_leads_count INT DEFAULT 0,
        converted_leads_count INT DEFAULT 0,
        invalid_leads_count INT DEFAULT 0,
        cpl NUMERIC(10, 2) DEFAULT 0,
        roas NUMERIC(10, 2) DEFAULT 0,
        target_audience JSONB DEFAULT '{}'::jsonb,
        ad_sets JSONB DEFAULT '[]'::jsonb,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 9. Call Logs Reports Table (Note: call recording audio stored in mobile storage itself)
    await client.query(`
      CREATE TABLE IF NOT EXISTS reports_call_logs (
        id VARCHAR(255) PRIMARY KEY,
        lead_id VARCHAR(255),
        lead_name VARCHAR(255),
        lead_phone VARCHAR(50),
        assignee_id VARCHAR(255),
        assignee_name VARCHAR(255),
        call_type VARCHAR(50) DEFAULT 'outgoing',
        duration_seconds INT DEFAULT 0,
        disposition VARCHAR(100) DEFAULT 'Follow Up',
        call_recording_local_path VARCHAR(255),
        call_notes TEXT,
        assignee_remarks TEXT,
        transcript TEXT,
        ai_summary TEXT,
        sentiment VARCHAR(50) DEFAULT 'Neutral',
        call_timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 10. Leads Table (including assignee values)
    await client.query(`
      CREATE TABLE IF NOT EXISTS leads (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        phone VARCHAR(50),
        email VARCHAR(255),
        company VARCHAR(255),
        city VARCHAR(100),
        state VARCHAR(100),
        source VARCHAR(100),
        status VARCHAR(100),
        pipeline_stage_id VARCHAR(255),
        deal_value NUMERIC(15, 2) DEFAULT 0,
        assignee_id VARCHAR(255),
        assignee_name VARCHAR(255),
        ai_score INT DEFAULT 0,
        ai_rating VARCHAR(50),
        ai_reasoning TEXT,
        notes TEXT,
        custom_fields JSONB DEFAULT '{}'::jsonb,
        tags JSONB DEFAULT '[]'::jsonb,
        gclid VARCHAR(255),
        fbclid VARCHAR(255),
        data JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 11. Omnichannel Chat Messages (WhatsApp / SMS)
    await client.query(`
      CREATE TABLE IF NOT EXISTS messages (
        id VARCHAR(255) PRIMARY KEY,
        lead_id VARCHAR(255),
        channel VARCHAR(50) DEFAULT 'whatsapp',
        direction VARCHAR(50) DEFAULT 'outbound',
        content TEXT,
        media_url TEXT,
        status VARCHAR(50) DEFAULT 'delivered',
        template_id VARCHAR(255),
        assignee_id VARCHAR(255),
        timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 12. WhatsApp Cloud API Templates
    await client.query(`
      CREATE TABLE IF NOT EXISTS whatsapp_templates (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        category VARCHAR(100) DEFAULT 'MARKETING',
        language VARCHAR(50) DEFAULT 'en_US',
        header_type VARCHAR(50),
        header_content TEXT,
        body_text TEXT,
        footer_text TEXT,
        buttons JSONB DEFAULT '[]'::jsonb,
        status VARCHAR(50) DEFAULT 'APPROVED',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 13. AI Automations & Workflows Rules
    await client.query(`
      CREATE TABLE IF NOT EXISTS workflows (
        id VARCHAR(255) PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        trigger_event VARCHAR(100) NOT NULL,
        trigger_stage_id VARCHAR(255),
        actions JSONB DEFAULT '[]'::jsonb,
        is_active BOOLEAN DEFAULT TRUE,
        execution_count INT DEFAULT 0,
        last_triggered_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 14. Drip Sequences & Scheduled Executions
    await client.query(`
      CREATE TABLE IF NOT EXISTS drip_schedules (
        id VARCHAR(255) PRIMARY KEY,
        workflow_id VARCHAR(255),
        lead_id VARCHAR(255),
        step_index INT DEFAULT 0,
        scheduled_time TIMESTAMP WITH TIME ZONE,
        status VARCHAR(50) DEFAULT 'PENDING',
        payload JSONB DEFAULT '{}'::jsonb,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 15. Inbound/Outbound Webhooks Registry
    await client.query(`
      CREATE TABLE IF NOT EXISTS webhooks (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        endpoint_url TEXT NOT NULL,
        source_platform VARCHAR(100) DEFAULT 'Facebook',
        secret_key VARCHAR(255),
        is_active BOOLEAN DEFAULT TRUE,
        total_payloads_received INT DEFAULT 0,
        last_received_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 16. Tasks & Action Items
    await client.query(`
      CREATE TABLE IF NOT EXISTS tasks (
        id VARCHAR(255) PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        lead_id VARCHAR(255),
        lead_name VARCHAR(255),
        assignee_id VARCHAR(255),
        assignee_name VARCHAR(255),
        due_date TIMESTAMP WITH TIME ZONE,
        priority VARCHAR(50) DEFAULT 'Medium',
        status VARCHAR(50) DEFAULT 'Pending',
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 17. Lead Activity Logs & Audit Trail
    await client.query(`
      CREATE TABLE IF NOT EXISTS activity_logs (
        id VARCHAR(255) PRIMARY KEY,
        lead_id VARCHAR(255),
        agent_id VARCHAR(255),
        agent_name VARCHAR(255),
        activity_type VARCHAR(50) DEFAULT 'call',
        title VARCHAR(255),
        description TEXT,
        metadata JSONB DEFAULT '{}'::jsonb,
        timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 18. Documents, Quotes & Digital Signatures
    await client.query(`
      CREATE TABLE IF NOT EXISTS documents_quotes (
        id VARCHAR(255) PRIMARY KEY,
        quote_number VARCHAR(100) NOT NULL,
        lead_id VARCHAR(255),
        lead_name VARCHAR(255),
        title VARCHAR(255) NOT NULL,
        total_amount NUMERIC(15, 2) DEFAULT 0,
        tax_amount NUMERIC(15, 2) DEFAULT 0,
        currency VARCHAR(10) DEFAULT 'INR',
        status VARCHAR(50) DEFAULT 'SENT',
        pdf_url TEXT,
        signature_status VARCHAR(50) DEFAULT 'UNSIGNED',
        signed_at TIMESTAMP WITH TIME ZONE,
        valid_until DATE,
        items JSONB DEFAULT '[]'::jsonb,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 19. Integrations Credentials & Configuration
    await client.query(`
      CREATE TABLE IF NOT EXISTS integrations_config (
        id VARCHAR(255) PRIMARY KEY,
        integration_name VARCHAR(100) NOT NULL,
        is_connected BOOLEAN DEFAULT FALSE,
        credentials JSONB DEFAULT '{}'::jsonb,
        sync_frequency VARCHAR(50) DEFAULT 'Real-time',
        last_sync_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 20. Meta CAPI & Google Ads Conversion Signals Event Queue
    await client.query(`
      CREATE TABLE IF NOT EXISTS conversion_events (
        id VARCHAR(255) PRIMARY KEY,
        lead_id VARCHAR(255),
        lead_name VARCHAR(255),
        platform VARCHAR(50) DEFAULT 'google_ads',
        event_name VARCHAR(255),
        crm_stage VARCHAR(100),
        value NUMERIC(15, 2) DEFAULT 0,
        currency VARCHAR(10) DEFAULT 'INR',
        gclid VARCHAR(255),
        fbclid VARCHAR(255),
        hashed_email VARCHAR(255),
        hashed_phone VARCHAR(255),
        status VARCHAR(50) DEFAULT 'sent',
        response_payload JSONB DEFAULT '{}'::jsonb,
        retry_count INT DEFAULT 0,
        is_offline_conversion BOOLEAN DEFAULT TRUE,
        timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 21. AI Copilot & Voice Bot Qualification Sessions
    await client.query(`
      CREATE TABLE IF NOT EXISTS ai_sessions (
        id VARCHAR(255) PRIMARY KEY,
        lead_id VARCHAR(255),
        session_type VARCHAR(50) DEFAULT 'voice_bot',
        qualification_score INT DEFAULT 0,
        is_qualified BOOLEAN DEFAULT TRUE,
        transcript TEXT,
        ai_summary TEXT,
        key_insights JSONB DEFAULT '{}'::jsonb,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log('⚡ AWS Aurora RDS database tables (21 Total Modules) initialized successfully.');
  } catch (err: any) {
    console.warn('⚠️ AWS Aurora RDS notice:', err.message);
  } finally {
    if (client) try { client.release(); } catch (e) {}
    if (pool) try { await pool.end(); } catch (e) {}
  }
}

export async function seedAwsDbMockData() {
  try {
    const pool = await getAwsClient();
    const client = await pool.connect();
    
    // Ensure tables exist
    await initializeAwsDbTables();

    // 1. Seed Company Info
    await client.query(`
      INSERT INTO company_info (id, company_name, details, logo_url, email, phone, website, address, city, state, country, pincode, gstin)
      VALUES (
        'comp-101',
        'KITE Aviation & CRM Solutions',
        'Leading Aviation Academy & High-Velocity CRM Suite with Power Dialer and Meta CAPI.',
        'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=150',
        'contact@kiteaviation.edu',
        '+91 80 4920 1100',
        'https://kiteaviation.edu',
        'No. 42, Begumpet Airport Road',
        'Hyderabad',
        'Telangana',
        'India',
        '500016',
        '36AAAAA0000A1Z5'
      )
      ON CONFLICT (id) DO UPDATE SET updated_at = NOW();
    `);

    // 2. Seed Assignees (Leaderboard Data) from INITIAL_AGENTS
    for (const a of INITIAL_AGENTS) {
      const winRate = a.totalCallsToday > 0 ? Math.round(((a.convertedLeadsCount || 0) / a.totalCallsToday) * 100) : 0;
      await client.query(`
        INSERT INTO assignees (id, name, email, phone, role, status, avatar_url, permission_template_id, total_calls_today, talk_time_seconds, converted_leads_count, revenue_generated, response_time_minutes, win_rate, details)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
        ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, total_calls_today = EXCLUDED.total_calls_today, revenue_generated = EXCLUDED.revenue_generated, updated_at = NOW();
      `, [
        a.id, a.name, a.email, a.phone, a.role, a.status, a.avatar || null, a.permissionTemplateId || null,
        a.totalCallsToday || 0, (a.talkTimeMinutes || 0) * 60, a.convertedLeadsCount || 0, a.revenueGenerated || 0,
        a.responseTimeMinutes || 0, winRate, JSON.stringify(a)
      ]);
    }

    // 3. Seed Pipeline Stages from INITIAL_STAGES
    for (const s of INITIAL_STAGES) {
      await client.query(`
        INSERT INTO pipeline_stages (id, stage_name, color, display_order, win_probability, is_active)
        VALUES ($1, $2, $3, $4, $5, TRUE)
        ON CONFLICT (id) DO UPDATE SET stage_name = EXCLUDED.stage_name, color = EXCLUDED.color, display_order = EXCLUDED.display_order, win_probability = EXCLUDED.win_probability, updated_at = NOW();
      `, [s.id, s.name, s.color, s.order, s.winProbability]);
    }

    // 4. Seed Telephone & Call Settings
    await client.query(`
      INSERT INTO telephone_call_settings (id, provider_name, auto_dialer_enabled, call_recording_enabled, local_storage_path, dialer_speed, ring_timeout_seconds, whatsapp_integration_enabled)
      VALUES ('call-settings-main', 'Antigravity Mobile Power Dialer', TRUE, TRUE, '/mobile/storage/call_recordings/', '1.5x', 30, TRUE)
      ON CONFLICT (id) DO UPDATE SET updated_at = NOW();
    `);

    // 5. Seed Field Settings from INITIAL_CUSTOM_FIELDS
    for (let i = 0; i < INITIAL_CUSTOM_FIELDS.length; i++) {
      const f = INITIAL_CUSTOM_FIELDS[i];
      await client.query(`
        INSERT INTO field_settings (id, field_key, field_label, field_type, category, options, is_required, is_primary, primary_slot, display_order)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        ON CONFLICT (id) DO UPDATE SET field_label = EXCLUDED.field_label, category = EXCLUDED.category, updated_at = NOW();
      `, [f.id, f.name, f.label, f.type, f.category || 'General', JSON.stringify(f.options || []), Boolean(f.required), Boolean(f.isPrimary), f.primarySlot || null, i + 1]);
    }

    // 6. Seed Permission Templates from INITIAL_PERMISSION_TEMPLATES
    for (const pt of INITIAL_PERMISSION_TEMPLATES) {
      await client.query(`
        INSERT INTO permission_templates (id, template_name, description, is_default, is_root, rights)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (id) DO UPDATE SET template_name = EXCLUDED.template_name, rights = EXCLUDED.rights, updated_at = NOW();
      `, [pt.id, pt.name, pt.description || null, Boolean(pt.isDefault), Boolean(pt.isRoot), JSON.stringify(pt.rights)]);
    }

    // 7. Seed Follow Ups
    await client.query(`
      INSERT INTO follow_ups (id, lead_id, lead_name, lead_phone, assignee_id, assignee_name, follow_up_type, scheduled_at, status, notes)
      VALUES (
        'fol-101',
        'lead-1',
        'Rahul Dev',
        '+91 98451 22334',
        'agent-ms',
        'Madhava sai nagendra',
        'call',
        NOW() + INTERVAL '1 day',
        'Pending',
        'Follow up on Commercial Pilot License syllabus.'
      )
      ON CONFLICT (id) DO UPDATE SET updated_at = NOW();
    `);

    // 8. Seed Campaigns from INITIAL_CAMPAIGNS
    for (const cmp of INITIAL_CAMPAIGNS) {
      await client.query(`
        INSERT INTO campaigns (id, campaign_name, campaign_handle, platform, status, budget, spent, total_leads_generated, qualified_leads_count, converted_leads_count, cpl, roas, target_audience, ad_sets)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        ON CONFLICT (id) DO UPDATE SET spent = EXCLUDED.spent, updated_at = NOW();
      `, [
        cmp.id, cmp.name, (cmp as any).handle || cmp.templateName || null, (cmp as any).platform || 'WhatsApp Broadcast', (cmp as any).status || 'Active',
        (cmp as any).budget || 0, (cmp as any).spent || 0, cmp.sentCount || (cmp as any).leadsCount || 0, cmp.deliveredCount || (cmp as any).qualifiedCount || 0, cmp.readCount || (cmp as any).convertedCount || 0,
        (cmp as any).cpl || 0, (cmp as any).roas || 0, JSON.stringify((cmp as any).targetAudience || {}), JSON.stringify((cmp as any).adSets || [])
      ]);
    }

    // 9. Seed Call Logs Reports from INITIAL_CALL_RECORDS (call recording stored in mobile storage path)
    for (const c of INITIAL_CALL_RECORDS) {
      await client.query(`
        INSERT INTO reports_call_logs (id, lead_id, lead_name, lead_phone, assignee_id, assignee_name, call_type, duration_seconds, disposition, call_recording_local_path, call_notes, assignee_remarks, transcript, ai_summary, sentiment, call_timestamp)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
        ON CONFLICT (id) DO UPDATE SET duration_seconds = EXCLUDED.duration_seconds, disposition = EXCLUDED.disposition, updated_at = NOW();
      `, [
        c.id, c.leadId, c.leadName, c.leadPhone, c.agentId, c.agentName, c.type || 'outgoing',
        c.durationSeconds || 0, c.disposition || 'Follow Up', c.recordingUrl || null, c.notes || null,
        c.assigneeRemarks || null, c.transcript || null, c.aiSummary || null, c.sentiment || 'Neutral',
        c.timestamp || new Date().toISOString()
      ]);
    }

    // 10. Seed Leads from INITIAL_LEADS (with assignee values)
    for (const l of INITIAL_LEADS) {
      await client.query(`
        INSERT INTO leads (id, name, phone, email, company, city, state, source, status, pipeline_stage_id, deal_value, assignee_id, assignee_name, ai_score, ai_rating, ai_reasoning, notes, custom_fields, tags, gclid, fbclid, data)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22)
        ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, status = EXCLUDED.status, assignee_id = EXCLUDED.assignee_id, assignee_name = EXCLUDED.assignee_name, updated_at = NOW();
      `, [
        l.id, l.name, l.phone || null, l.email || null, l.company || null, l.city || null, l.state || null,
        l.source || 'Website', l.status || 'Fresh', l.pipelineStageId || 'stage-1', l.dealValue || 0,
        l.ownerAgentId || null, l.ownerAgentName || null, l.aiScore || 0, l.aiRating || 'Warm', l.aiReasoning || null,
        l.notes || null, JSON.stringify(l.customFields || {}), JSON.stringify(l.tags || []), l.gclid || null, l.fbclid || null, JSON.stringify(l)
      ]);
    }

    // 11. Seed Messages from INITIAL_MESSAGES
    for (const msg of INITIAL_MESSAGES) {
      await client.query(`
        INSERT INTO messages (id, lead_id, channel, direction, content, media_url, status, template_id, timestamp)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        ON CONFLICT (id) DO UPDATE SET timestamp = NOW();
      `, [msg.id, msg.leadId, msg.channel || 'whatsapp', msg.direction || 'outbound', msg.content, msg.mediaUrl || null, msg.status || 'delivered', msg.templateId || null, msg.timestamp || new Date().toISOString()]);
    }

    // 12. Seed WhatsApp Templates from INITIAL_TEMPLATES
    for (const tmpl of INITIAL_TEMPLATES) {
      await client.query(`
        INSERT INTO whatsapp_templates (id, name, category, language, header_type, header_content, body_text, footer_text, buttons, status)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        ON CONFLICT (id) DO UPDATE SET body_text = EXCLUDED.body_text, updated_at = NOW();
      `, [tmpl.id, tmpl.name, tmpl.category || 'MARKETING', tmpl.language || 'en_US', (tmpl as any).headerType || null, (tmpl as any).headerContent || null, tmpl.body || (tmpl as any).bodyText || '', (tmpl as any).footerText || null, JSON.stringify((tmpl as any).buttons || []), tmpl.status || 'APPROVED']);
    }

    // 13. Seed Workflows from INITIAL_WORKFLOWS
    for (const wf of INITIAL_WORKFLOWS) {
      await client.query(`
        INSERT INTO workflows (id, title, trigger_event, trigger_stage_id, actions, is_active, execution_count, last_triggered_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, updated_at = NOW();
      `, [wf.id, wf.name || (wf as any).title || 'Untitled Workflow', wf.triggerEvent || 'custom_event', (wf as any).triggerStageId || null, JSON.stringify(wf.actions || []), Boolean(wf.isActive), wf.executedCount || (wf as any).executionCount || 0, (wf as any).lastTriggeredAt || null]);
    }

    // 14. Seed Drip Schedules
    await client.query(`
      INSERT INTO drip_schedules (id, workflow_id, lead_id, step_index, status)
      VALUES ('drip-1', 'wf-1', 'lead-1', 1, 'PENDING')
      ON CONFLICT (id) DO UPDATE SET created_at = NOW();
    `);

    // 15. Seed Webhooks
    await client.query(`
      INSERT INTO webhooks (id, name, endpoint_url, source_platform, total_payloads_received)
      VALUES ('wh-1', 'Facebook Lead Ads Receiver', 'http://localhost:3000/api/webhooks/lead', 'Facebook', 89)
      ON CONFLICT (id) DO UPDATE SET created_at = NOW();
    `);

    // 16. Seed Tasks
    await client.query(`
      INSERT INTO tasks (id, title, lead_id, lead_name, assignee_id, assignee_name, priority, status, notes)
      VALUES ('task-1', 'Call Rahul Dev for CPL syllabus review', 'lead-1', 'Rahul Dev', 'agent-ms', 'Madhava sai nagendra', 'High', 'Pending', 'Send course pdf before call')
      ON CONFLICT (id) DO UPDATE SET updated_at = NOW();
    `);

    // 17. Seed Activity Logs from INITIAL_ACTIVITIES
    for (const act of INITIAL_ACTIVITIES) {
      await client.query(`
        INSERT INTO activity_logs (id, lead_id, agent_id, agent_name, activity_type, title, description, timestamp)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (id) DO UPDATE SET timestamp = NOW();
      `, [act.id, act.leadId, act.agentId, act.agentName, act.type, act.title, act.description, act.timestamp || new Date().toISOString()]);
    }

    // 18. Seed Documents & Quotes
    await client.query(`
      INSERT INTO documents_quotes (id, quote_number, lead_id, lead_name, title, total_amount, status, signature_status)
      VALUES ('doc-1', 'QT-2026-0891', 'lead-1', 'Rahul Dev', 'Commercial Pilot Training Proposal', 250000, 'SENT', 'UNSIGNED')
      ON CONFLICT (id) DO UPDATE SET updated_at = NOW();
    `);

    // 19. Seed Integrations Config
    await client.query(`
      INSERT INTO integrations_config (id, integration_name, is_connected, sync_frequency)
      VALUES ('int-1', 'Google Sheets Integration', TRUE, 'Real-time')
      ON CONFLICT (id) DO UPDATE SET updated_at = NOW();
    `);

    // 20. Seed Conversion Events (Meta CAPI & Google Ads)
    await client.query(`
      INSERT INTO conversion_events (id, lead_id, lead_name, platform, event_name, crm_stage, value, status)
      VALUES ('evt-1', 'lead-1', 'Rahul Dev', 'meta_ads', 'Lead', 'New Lead', 100, 'sent')
      ON CONFLICT (id) DO UPDATE SET timestamp = NOW();
    `);

    // 21. Seed AI Sessions
    await client.query(`
      INSERT INTO ai_sessions (id, lead_id, session_type, qualification_score, is_qualified, ai_summary)
      VALUES ('ai-sess-1', 'lead-1', 'voice_bot', 92, TRUE, 'Qualified lead for CPL program.')
      ON CONFLICT (id) DO UPDATE SET created_at = NOW();
    `);

    const resCount = await client.query('SELECT count(*) FROM leads;');
    const resLeads = await client.query('SELECT id, name, phone, status, assignee_name FROM leads LIMIT 10;');

  } catch (err: any) {
    return {
      success: false,
      error: err.message,
      message: 'Failed to seed data into AWS Aurora RDS. Check database credentials and network access.'
    };
  } finally {
    if (client) try { client.release(); } catch (e) {}
    if (pool) try { await pool.end(); } catch (e) {}
  }
}

export async function getAwsDbTablesSummary() {
  try {
    const pool = await getAwsClient();
    const client = await pool.connect();

    const resTables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);

    const tablesSummary: any[] = [];

    for (const row of resTables.rows) {
      const tableName = row.table_name;
      const countRes = await client.query(`SELECT count(*) FROM "${tableName}";`);
      const colsRes = await client.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = $1 
        ORDER BY ordinal_position;
      `, [tableName]);
      const sampleRes = await client.query(`SELECT * FROM "${tableName}" LIMIT 5;`);

      tablesSummary.push({
        tableName,
        rowCount: parseInt(countRes.rows[0].count, 10),
        columns: colsRes.rows.map((c: any) => `${c.column_name} (${c.data_type})`),
        sampleRows: sampleRes.rows
      });
    }

  } catch (err: any) {
    return {
      success: false,
      error: err.message
    };
  } finally {
    if (client) try { client.release(); } catch (e) {}
    if (pool) try { await pool.end(); } catch (e) {}
  }
}

export async function saveLeadToAwsDb(lead: any) {
  try {
    const pool = await getAwsClient();
    const client = await pool.connect();
    
    await client.query(`
      INSERT INTO leads (id, name, phone, email, company, city, state, source, status, pipeline_stage_id, deal_value, assignee_id, assignee_name, ai_score, ai_rating, ai_reasoning, notes, custom_fields, tags, gclid, fbclid, data)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22)
      ON CONFLICT (id) DO UPDATE SET 
        name = EXCLUDED.name, 
        status = EXCLUDED.status, 
        assignee_id = EXCLUDED.assignee_id, 
        assignee_name = EXCLUDED.assignee_name, 
        updated_at = NOW();
    `, [
      lead.id,
      lead.name,
      lead.phone || null,
      lead.email || null,
      lead.company || null,
      lead.city || null,
      lead.state || null,
      lead.source || 'Webhook',
      lead.status || 'Fresh',
      lead.pipelineStageId || 'stage-1',
      lead.dealValue || 0,
      lead.ownerAgentId || 'agent-ms',
      lead.ownerAgentName || 'Madhava sai nagendra',
      lead.aiScore || 85,
      lead.aiRating || 'Hot',
      lead.aiReasoning || 'Captured via Webhook',
      lead.notes || '',
      JSON.stringify(lead.customFields || {}),
      JSON.stringify(lead.tags || []),
      lead.gclid || null,
      lead.fbclid || null,
      JSON.stringify(lead)
    ]);

  } catch (err: any) {
    console.error('⚠️ AWS RDS Lead Save Error:', err.message);
    return { success: false, error: err.message };
  } finally {
    if (client) try { client.release(); } catch (e) {}
    if (pool) try { await pool.end(); } catch (e) {}
  }
}

export async function logWebhookToAwsDb(webhook: any) {
  try {
    const pool = await getAwsClient();
    const client = await pool.connect();
    
    await client.query(`
      INSERT INTO webhooks (id, name, endpoint_url, source_platform, total_payloads_received, last_received_at)
      VALUES ($1, $2, $3, $4, 1, NOW())
      ON CONFLICT (id) DO UPDATE SET 
        total_payloads_received = webhooks.total_payloads_received + 1, 
        last_received_at = NOW();
    `, [
      webhook.id || `wh-${Date.now()}`,
      webhook.name || 'Ad Webhook',
      webhook.endpointUrl || 'http://localhost:3000/api/webhooks/lead',
      webhook.sourcePlatform || 'Facebook',
    ]);

  } catch (err: any) {
    console.warn('⚠️ Webhook Log Notice:', err.message);
  } finally {
    if (client) try { client.release(); } catch (e) {}
    if (pool) try { await pool.end(); } catch (e) {}
  }
}

export async function getIntegrationsConfigFromAwsDb() {
  try {
    const pool = await getAwsClient();
    const client = await pool.connect();
    const res = await client.query('SELECT * FROM integrations_config ORDER BY updated_at DESC;');
  } catch (err: any) {
    console.warn('⚠️ AWS RDS Integrations Config Fetch Error:', err.message);
    return { success: false, configs: [], error: err.message };
  } finally {
    if (client) try { client.release(); } catch (e) {}
    if (pool) try { await pool.end(); } catch (e) {}
  }
}

export async function saveIntegrationConfigToAwsDb(config: { id: string; name: string; isConnected: boolean; credentials: any; syncFrequency?: string }) {
  try {
    const pool = await getAwsClient();
    const client = await pool.connect();
    
    await client.query(`
      INSERT INTO integrations_config (id, integration_name, is_connected, credentials, sync_frequency, last_sync_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
      ON CONFLICT (id) DO UPDATE SET
        integration_name = EXCLUDED.integration_name,
        is_connected = EXCLUDED.is_connected,
        credentials = EXCLUDED.credentials,
        sync_frequency = EXCLUDED.sync_frequency,
        last_sync_at = NOW(),
        updated_at = NOW();
    `, [
      config.id,
      config.name,
      config.isConnected,
      JSON.stringify(config.credentials || {}),
      config.syncFrequency || 'Real-time'
    ]);

  } catch (err: any) {
    console.error('⚠️ AWS RDS Integration Save Error:', err.message);
    return { success: false, error: err.message };
  } finally {
    if (client) try { client.release(); } catch (e) {}
    if (pool) try { await pool.end(); } catch (e) {}
  }
}
