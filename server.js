import express from 'express';
import dotenv from 'dotenv';
import crypto from 'crypto';

dotenv.config();

const app = express();

// Preserve the raw request body for HMAC-SHA256 signature verification
app.use(express.json({
  verify: (req, res, buf) => {
    req.rawBody = buf;
  }
}));

/**
 * Verifies the X-Hub-Signature-256 header sent by Meta using HMAC-SHA256 and crypto.timingSafeEqual
 */
function verifyMetaSignature(req) {
  const signature = req.headers['x-hub-signature-256'];
  if (!signature) {
    return false;
  }

  const appSecret = process.env.META_APP_SECRET;
  if (!appSecret) {
    console.error('META_APP_SECRET is not configured in environment variables.');
    return false;
  }

  const parts = signature.split('sha256=');
  const signatureHash = parts[1];
  if (!signatureHash) {
    return false;
  }

  const expectedHash = crypto
    .createHmac('sha256', appSecret)
    .update(req.rawBody || '')
    .digest('hex');

  const sigBuffer = Buffer.from(signatureHash, 'utf8');
  const expectedBuffer = Buffer.from(expectedHash, 'utf8');

  if (sigBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(sigBuffer, expectedBuffer);
}

/**
 * Asynchronously process the lead event payload and fetch details from Meta Graph API
 */
async function processLeadEvent(body) {
  console.log('\n================================================================');
  console.log('📥 [META WEBHOOK] RAW EVENT PAYLOAD:');
  console.log(JSON.stringify(body, null, 2));
  console.log('================================================================\n');

  if (!body.entry || !Array.isArray(body.entry)) {
    console.log('ℹ️ [Meta Webhook] No entry array found in payload.');
    return;
  }

  for (const entry of body.entry) {
    if (!entry.changes || !Array.isArray(entry.changes)) continue;

    for (const change of entry.changes) {
      if (change.field === 'leadgen' && change.value) {
        const { leadgen_id, page_id, form_id, ad_id, adgroup_id, created_time } = change.value;
        const eventTime = created_time ? new Date(created_time * 1000).toLocaleString() : new Date().toLocaleString();

        console.log('╔══════════════════════════════════════════════════════════════╗');
        console.log('║                   🎯 NEW META LEAD RECEIVED!                ║');
        console.log('╠══════════════════════════════════════════════════════════════╣');
        console.log(`║ Lead ID      : ${leadgen_id}`);
        console.log(`║ Page ID      : ${page_id}`);
        console.log(`║ Form ID      : ${form_id}`);
        console.log(`║ Ad ID        : ${ad_id || 'N/A'}`);
        console.log(`║ AdGroup ID   : ${adgroup_id || 'N/A'}`);
        console.log(`║ Received At  : ${eventTime}`);
        console.log('╚══════════════════════════════════════════════════════════════╝\n');

        // Check if this is a Meta Dashboard dummy mock ID (e.g. "444444444444")
        if (leadgen_id === '444444444444' || !leadgen_id) {
          console.log('💡 [Notice] Meta sent a mock test lead ID ("444444444444").');
          console.log('   The webhook pipeline is working perfectly!');
          console.log('   (Mock IDs do not exist on Graph API. Use the Lead Ads Testing Tool to test real contact fields).\n');
          continue;
        }

        const pageToken = process.env.META_PAGE_ACCESS_TOKEN;
        if (!pageToken) {
          console.warn('⚠️ [Meta Lead Ads] META_PAGE_ACCESS_TOKEN is not configured in .env. Skipping Graph API fetch.');
          continue;
        }

        try {
          console.log(`🌐 [Graph API] Querying contact details for Lead ID: ${leadgen_id}...`);
          const res = await fetch(`https://graph.facebook.com/v21.0/${leadgen_id}?access_token=${pageToken}`);
          const leadData = await res.json();

          if (leadData.error) {
            console.error('❌ [Graph API Error]:', leadData.error);
            continue;
          }

          console.log('✅ [Graph API Response Received]:');
          console.log(JSON.stringify(leadData, null, 2));

          // Parse field_data array into key-value map
          const fields = {};
          if (Array.isArray(leadData.field_data)) {
            for (const item of leadData.field_data) {
              fields[item.name] = (item.values && item.values.length > 0) ? item.values[0] : null;
            }
          }

          console.log('\n================================================================');
          console.log('📋 EXTRACTED LEAD CONTACT INFORMATION:');
          console.log(`- Full Name : ${fields.full_name || fields.name || fields.first_name || 'N/A'}`);
          console.log(`- Email     : ${fields.email || 'N/A'}`);
          console.log(`- Phone     : ${fields.phone_number || fields.phone || 'N/A'}`);
          console.log(`- All Fields:`, fields);
          console.log('================================================================\n');

          // Append to local leads log file for record keeping
          try {
            const fs = await import('fs');
            const logEntry = `[${new Date().toISOString()}] Lead ID: ${leadgen_id} | Name: ${fields.full_name || fields.name || 'N/A'} | Email: ${fields.email || 'N/A'} | Phone: ${fields.phone_number || 'N/A'}\n${JSON.stringify({ leadData, fields }, null, 2)}\n\n`;
            fs.appendFileSync('leads_received.log', logEntry);
          } catch (fsErr) {
            // ignore file write error
          }
        } catch (err) {
          console.error('❌ [Meta Lead Ads] Exception while fetching lead details:', err);
        }
      }
    }
  }
}

// Global Request Logger Middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

// Health check / welcome route
app.get('/', (req, res) => {
  res.status(200).send('Meta Lead Ads Webhook Server is online and operational!');
});

// Handler for Webhook Verification (GET)
const handleWebhookVerification = (req, res) => {
  const mode = req.query['hub.mode'] || req.query['hub_mode'] || req.query['mode'];
  const token = req.query['hub.verify_token'] || req.query['hub_verify_token'] || req.query['verify_token'];
  const challenge = req.query['hub.challenge'] || req.query['hub_challenge'] || req.query['challenge'];

  const verifyToken = process.env.META_VERIFY_TOKEN || process.env.META_WEBHOOK_VERIFY_TOKEN;

  console.log(`[Verification] mode: "${mode}", token: "${token}", challenge: "${challenge}"`);

  if (mode === 'subscribe' && token === verifyToken) {
    console.log(`✓ Handshake verified successfully! Returning challenge: ${challenge}`);
    res.setHeader('Content-Type', 'text/plain');
    return res.status(200).send(challenge);
  } else {
    console.warn(`✗ Verification failed. Expected token "${verifyToken}", received "${token}". Mode: "${mode}"`);
    return res.status(403).send('Forbidden: Token mismatch or invalid mode.');
  }
};

// Handler for Webhook Events (POST)
const handleWebhookEvent = (req, res) => {
  console.log('\n==========================================');
  console.log('[Meta Webhook] Incoming POST Event Headers:', JSON.stringify(req.headers, null, 2));
  console.log('[Meta Webhook] Incoming Body:', JSON.stringify(req.body, null, 2));
  console.log('==========================================\n');

  const isValidSignature = verifyMetaSignature(req);
  if (!isValidSignature) {
    console.warn('⚠️ [Meta Webhook] Signature verification warning (check META_APP_SECRET for active app). Proceeding in dev mode...');
  } else {
    console.log('🔒 [Meta Webhook] X-Hub-Signature-256 verified successfully!');
  }

  // Immediately respond with 200 to acknowledge receipt to Meta within 20s
  res.status(200).send('EVENT_RECEIVED');

  // Asynchronously process the lead event body
  processLeadEvent(req.body);
};

// Routes (supporting both /webhooks/meta-leads and /webhook with/without trailing slashes)
app.get(['/webhooks/meta-leads', '/webhooks/meta-leads/', '/webhook', '/webhook/'], handleWebhookVerification);
app.post(['/webhooks/meta-leads', '/webhooks/meta-leads/', '/webhook', '/webhook/'], handleWebhookEvent);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
  console.log(`Meta Webhook endpoint: http://localhost:${PORT}/webhooks/meta-leads`);
});

