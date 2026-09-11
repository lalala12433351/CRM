# Pixbe CRM - Meta Lead Ads Development & Testing Guide

This guide documents the complete end-to-end setup, developer testing workflow, and architecture for Facebook & Instagram Lead Ads ingestion in Pixbe CRM.

---

## 📌 Quick Summary & Architecture

```
[Facebook / Instagram Lead Ad Form]
                │
                ▼ (Real-Time Webhook)
[POST /api/webhooks/meta] (Express Server on Port 8080)
                │
                ▼ (Immediate 200 OK Response)
[meta.worker.ts (Background Worker)]
                │
                ├─► 1. Calls Graph API (v22.0) /v22.0/{leadgen_id} using Page Access Token
                ├─► 2. Parses full_name, email, phone_number, custom form fields
                ├─► 3. Idempotently stores lead in multi_tenant_store.json & PostgreSQL
                └─► 4. Triggers workflowEngine ('on_facebook_lead' / 'lead_created')
```

---

## 🚀 1. Developer Setup (2-Minute Quick Start)

### Step 1: Configure Environment Variables
Add your Meta App credentials and your test Page token to your `.env` file:

```env
PORT=8080
NODE_ENV=development
APP_URL=http://localhost:8080

# Meta Configuration
META_APP_ID="your_meta_app_id"
META_APP_SECRET="your_meta_app_secret"
META_WEBHOOK_VERIFY_TOKEN="pixbe_meta_verify_token"
META_PAGE_ACCESS_TOKEN="your_test_page_access_token"
```

### Step 2: How to Get your Test Page Access Token
1. Open [Meta Graph API Explorer](https://developers.facebook.com/tools/explorer/).
2. Select your **Meta App**.
3. Under **User or Page**, choose your test Facebook Page.
4. Add the following permissions:
   - `leads_retrieval`
   - `pages_manage_ads`
   - `pages_read_engagement`
   - `pages_show_list`
5. Click **Generate Access Token** and paste it into `META_PAGE_ACCESS_TOKEN` in `.env`.

---

## 🌐 2. Expose Local Server via Tunnel (ngrok)

1. Start your CRM development server (if not already running):
   ```bash
   npm run dev
   ```

2. In a separate terminal, start ngrok pointing to port 8080:
   ```bash
   npx ngrok http 8080
   ```
   *(Or with permanent free static domain: `ngrok http --domain=your-subdomain.ngrok-free.app 8080`)*

3. Copy the secure HTTPS URL (e.g. `https://abc-123.ngrok-free.app`).

---

## ⚙️ 3. Meta Developer Portal Webhook Setup

1. Go to [Meta for Developers Dashboard](https://developers.facebook.com/) &rarr; Your App.
2. In the left menu, select **Webhooks** &rarr; Select **Page** from the dropdown.
3. Click **Subscribe to this object** (or Edit Subscription):
   - **Callback URL**: `https://<YOUR-NGROK-DOMAIN>/api/webhooks/meta`
   - **Verify Token**: `pixbe_meta_verify_token` (must match `META_WEBHOOK_VERIFY_TOKEN` in `.env`)
4. Click **Verify and save**.
5. On the **`leadgen`** row in the subscription table, click **Subscribe**.

---

## 🧪 4. Testing with Meta's Lead Ads Testing Tool

1. Open the [Meta Lead Ads Testing Tool](https://developers.facebook.com/tools/lead-ads-testing).
2. Select your **Facebook Page** and your **Instant Lead Form**.
3. (Optional) Click **Preview form** to enter test details.
4. Click **Create Lead**.
5. Click **Track Status** &rarr; verify Meta received `HTTP 200 OK`.
6. Look at your server console running `npm run dev`:
   ```
   [Meta Worker] ✅ Lead ingested live: Test User (+91 98765 00000)
   [WorkflowEngine] Executing active workflow ... triggered by "on_facebook_lead"
   ```
7. Open `http://localhost:8080` &rarr; Go to **Leads** &rarr; verify the lead appears with stage `Fresh`, score, and Meta tags.

---

## 💻 5. Local Direct Webhook Simulation Scripts

If you want to test without opening the Meta Developer Dashboard, run one of the following commands:

### PowerShell:
```powershell
$payload = @{
    object = "page"
    entry = @(
        @{
            id = "1092837465"
            time = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds()
            changes = @(
                @{
                    field = "leadgen"
                    value = @{
                        ad_id = "ad_test_101"
                        form_id = "form_test_202"
                        leadgen_id = "simulated_lead_$(Get-Random)"
                        page_id = "1092837465"
                    }
                }
            )
        }
    )
} | ConvertTo-Json -Depth 5

Invoke-RestMethod -Uri "http://localhost:8080/api/webhooks/meta" -Method POST -Headers @{ "Content-Type" = "application/json" } -Body $payload
```

### cURL:
```bash
curl -X POST http://localhost:8080/api/webhooks/meta \
  -H "Content-Type: application/json" \
  -d '{
    "object": "page",
    "entry": [{
      "id": "1092837465",
      "changes": [{
        "field": "leadgen",
        "value": {
          "ad_id": "ad_test_101",
          "form_id": "form_test_202",
          "leadgen_id": "simulated_lead_001",
          "page_id": "1092837465"
        }
      }]
    }]
  }'
```

---

## 🏢 6. Production Multi-Tenant Architecture Note

- In **development**, the backend automatically falls back to `META_PAGE_ACCESS_TOKEN` in `.env`.
- In **production**, clients connect their own Facebook Pages by clicking **"Connect Facebook"** in **Settings &rarr; Integrations**.
- Tokens and page mappings are dynamically stored per client in the `meta_connected_pages` table and `.data/multi_tenant_store.json`.
- Webhook payloads are automatically mapped to the correct tenant based on `page_id`.

---

## 📋 Key Codebase References

- Webhook Routes: [`server/modules/integrations/meta/meta.routes.ts`](file:///c:/Users/cleme/OneDrive/Desktop/Pixbe%20Crm/server/modules/integrations/meta/meta.routes.ts)
- Webhook Controller: [`server/modules/integrations/meta/meta.controller.ts`](file:///c:/Users/cleme/OneDrive/Desktop/Pixbe%20Crm/server/modules/integrations/meta/meta.controller.ts)
- Ingestion Worker: [`server/modules/integrations/meta/meta.worker.ts`](file:///c:/Users/cleme/OneDrive/Desktop/Pixbe%20Crm/server/modules/integrations/meta/meta.worker.ts)
- Graph API Service: [`server/modules/integrations/meta/meta.service.ts`](file:///c:/Users/cleme/OneDrive/Desktop/Pixbe%20Crm/server/modules/integrations/meta/meta.service.ts)
- Workflow Automations: [`server/services/workflowEngine.ts`](file:///c:/Users/cleme/OneDrive/Desktop/Pixbe%20Crm/server/services/workflowEngine.ts)
