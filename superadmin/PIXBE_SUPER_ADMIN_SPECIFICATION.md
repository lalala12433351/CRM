# Pixbe CRM - Super Admin Application: Complete Architecture, Styling & Implementation Specification

> **PROMPT / SYSTEM SPECIFICATION DOCUMENT FOR AI AGENTS**  
> **Target Audience:** Autonomous AI Coding Agent (Cursor, Claude, GPT, Antigravity, Windsurf, Copilot)  
> **Project Target:** Build a high-performance, enterprise-grade **Super Admin Portal** for Pixbe CRM (ARCLE CRM & TeleSales Management Platform).  
> **Version:** 1.0.0 | Production-Ready Architecture  
> **Default Currency:** INR (`₹`) | **Timezone:** `Asia/Kolkata`

---

## 1. Executive Overview & Application Mission

### 1.1 What is Pixbe CRM?
**Pixbe CRM** (also branded as **ARCLE CRM & TeleSales Management**) is an enterprise multi-tenant CRM and Tele-sales automation system designed for high-velocity sales teams, educational admissions, and real estate operations. It unifies:
- Omnichannel Lead Management (Meta/Facebook Leads, Google Ads, IndiaMart, JustDial, Website forms).
- Integrated Power Dialer & Call Logs (local storage audio capture, call dispositions, transcripts, AI summaries).
- WhatsApp Cloud API messaging, automated drip sequences, and broadcast campaigns.
- Meta Conversion API (CAPI) & Google Ads Offline Conversion Attribution.
- Dynamic Role-Based Access Control (RBAC) with granular Permission Templates.
- Multi-Tenant Database Architecture with PostgreSQL (AWS Aurora RDS) and high-resilience local multi-tenant fallbacks.

### 1.2 Purpose of the Super Admin Application
The **Super Admin Application** is the centralized SaaS command center for the platform owners / operators of Pixbe CRM. While regular tenant admins manage only their individual organization, the **Super Admin** oversees the entire platform ecosystem:
1. **Multi-Tenant Operations:** Provisioning, monitoring, suspending, migrating, and configuring client tenant companies.
2. **Tenant Impersonation ("Login As"):** Ability to securely inspect and troubleshoot any tenant's workspace with a single click.
3. **Platform Financials & Subscriptions:** Razorpay transaction audits, plan tiers (Starter, Growth, Enterprise), recurring MRR/ARR analytics, and license management.
4. **AWS Aurora RDS Database Diagnostics:** Real-time database cluster telemetry, table row counts, schema inspector, and emergency maintenance.
5. **AI Usage & Quota Controller:** Monitoring Google Gemini tokens, AI VoiceBot sessions, transcription minutes, and sentiment analysis credits per tenant.
6. **Omnichannel & Webhook Hub:** Global Meta Page Access Tokens (`meta_connected_pages`), WhatsApp Cloud API routing, and webhook delivery health.
7. **Platform Security & Audit Logs:** Global administrative audit logs, failed login tracking, and system feature flags.

---

## 2. Complete Design System, Styling & Typography

The Super Admin MUST strictly inherit the exact design tokens, typography, and glassmorphic styling conventions of Pixbe CRM.

### 2.1 Typography & Google Fonts
Embed the following font stylesheet link in the HTML `<head>`:
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Open+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,400;1,600&family=Lora:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500;1,600;1,700&family=Merriweather:ital,wght@0,300;0,400;0,700;0,900;1,300;1,400&family=Poppins:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,400;1,500;1,600&family=Plus+Jakarta+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,400;1,500;1,600&family=Inter:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&display=swap" rel="stylesheet">
```

#### Font Family Variables
- **Primary / Headings / Nav:** `'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`
- **Serif / Quotations:** `'Lora', Georgia, serif` or `'Merriweather', Georgia, serif`
- **Body / Fallback:** `'Open Sans', sans-serif`, `'Plus Jakarta Sans'`, `'Inter'`
- **Headings Tracking:** `letter-spacing: -0.02em;`
- **Body Tracking:** `letter-spacing: -0.01em;`
- **Base Line Height:** `1.5`

### 2.2 Color Palette Tokens
| Token Name | Hex Code | Tailwind Equivalent | Usage |
| :--- | :--- | :--- | :--- |
| **Canvas Background** | `#F8FAFC` | `bg-slate-50` / `bg-slate-100` | Main application background |
| **Surface Pure** | `#FFFFFF` | `bg-white` | Card bodies, inputs, dialogs |
| **Primary Brand** | `#4F46E5` | `bg-indigo-600` | Primary CTAs, active nav items, key badges |
| **Primary Hover** | `#4338CA` | `hover:bg-indigo-700` | Button hover state |
| **Primary Subtle** | `#EEF2FF` | `bg-indigo-50` | Active tab backgrounds, soft pill badges |
| **Text Primary** | `#0F172A` / `#1E293B` | `text-slate-900` / `text-slate-800` | Main headings and labels |
| **Text Secondary** | `#64748B` | `text-slate-500` | Helper text, timestamps, subtitles |
| **Text Muted** | `#94A3B8` | `text-slate-400` | Placeholder text, disabled labels |
| **Border Subtle** | `#E2E8F0` | `border-slate-200` | Card borders, dividers |
| **Border Active** | `#CBD5E1` | `border-slate-300` | Input borders on hover |
| **Success / Converted** | `#10B981` / `#059669` | `bg-emerald-500` / `text-emerald-600` | Active status, revenue, positive metrics |
| **Warning / Pending** | `#F59E0B` / `#D97706` | `bg-amber-500` / `text-amber-600` | Trial expiring, pending sync, alerts |
| **Danger / Lost** | `#EF4444` / `#DC2626` | `bg-rose-500` / `text-rose-600` | Suspended tenants, failed webhooks, errors |
| **Info / Scheduled** | `#06B6D4` / `#3B82F6` | `bg-cyan-500` / `bg-blue-500` | Informational badges, sync timestamps |

### 2.3 Glassmorphism CSS Utilities
These utility classes must be included in `index.css`:
```css
/* Glass Mesh Ambient Background */
.glass-mesh-bg {
  background-color: #f1f5f9;
  background-image: 
    radial-gradient(at 0% 0%, rgba(99, 102, 241, 0.14) 0px, transparent 50%),
    radial-gradient(at 100% 0%, rgba(59, 130, 246, 0.14) 0px, transparent 50%),
    radial-gradient(at 100% 100%, rgba(168, 85, 247, 0.1) 0px, transparent 50%),
    radial-gradient(at 0% 100%, rgba(16, 185, 129, 0.1) 0px, transparent 50%);
  background-attachment: fixed;
}

/* Glass Panel (Header / Sidebar / Main Overlays) */
.glass-panel {
  background: rgba(255, 255, 255, 0.72) !important;
  backdrop-filter: blur(16px) saturate(180%) !important;
  -webkit-backdrop-filter: blur(16px) saturate(180%) !important;
  border: 1px solid rgba(255, 255, 255, 0.6) !important;
  box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.05) !important;
}

/* Glass Card (Metric Widgets / Tenant Cards) */
.glass-card {
  background: rgba(255, 255, 255, 0.8) !important;
  backdrop-filter: blur(12px) saturate(160%) !important;
  -webkit-backdrop-filter: blur(12px) saturate(160%) !important;
  border: 1px solid rgba(255, 255, 255, 0.7) !important;
  box-shadow: 0 4px 20px 0 rgba(0, 0, 0, 0.03) !important;
}

/* Glass Dropdown (Modals / Action Popovers) */
.glass-dropdown {
  background: rgba(255, 255, 255, 0.88) !important;
  backdrop-filter: blur(24px) saturate(200%) !important;
  -webkit-backdrop-filter: blur(24px) saturate(200%) !important;
  border: 1px solid rgba(255, 255, 255, 0.8) !important;
  box-shadow: 0 16px 48px rgba(15, 23, 42, 0.12) !important;
}

/* Minimal Smooth Scrollbar */
::-webkit-scrollbar {
  width: 5px;
  height: 5px;
}
::-webkit-scrollbar-track {
  background: #F1F5F9;
}
::-webkit-scrollbar-thumb {
  background: #CBD5E1;
  border-radius: 9999px;
}
::-webkit-scrollbar-thumb:hover {
  background: #94A3B8;
}
```

---

## 3. Technology Stack & Runtime Environment

| Layer | Recommended Specification |
| :--- | :--- |
| **Frontend Framework** | React 19 (`react`, `react-dom`) |
| **Language** | TypeScript (~5.8+) with strict mode |
| **Build Tool** | Vite 6 |
| **Styling** | Tailwind CSS v4 (`@tailwindcss/vite`) + Custom Glassmorphism |
| **Icons** | `lucide-react` |
| **Charts / Visuals** | `recharts` |
| **Animations** | `motion` (Framer Motion v12) |
| **Backend API** | Node.js + Express 4.x (`server.ts` or standalone `/api/superadmin`) |
| **Database** | PostgreSQL on AWS Aurora RDS (`pg`, `@aws-sdk/rds-signer`) |
| **Multi-Tenancy** | Row-level tenant partitioning via `tenant_id` & schema table indexing |
| **Payments** | Razorpay Order API & Signature Verification |

---

## 4. Multi-Tenant Architecture & Database Schema Reference

### 4.1 Database Deployment Strategy: Shared Aurora RDS (NO Separate DB Required)
> **CRITICAL ARCHITECTURAL DECISION FOR AI AGENTS:**
> **The Super Admin DOES NOT need a separate physical database.**  
> It must connect directly to the **SAME AWS Aurora RDS PostgreSQL cluster** (`database-1.cluster-cvwo02ecys5c.ap-south-2.rds.amazonaws.com`) as Pixbe CRM.
>
> **Why Single-Database is Superior for Pixbe:**
> 1. **Zero-Latency Real-Time Telemetry:** The Super Admin can query live KPIs (e.g. `SELECT count(*) FROM leads`, `SELECT count(*) FROM assignees WHERE status='online'`) without cross-database synchronization lag.
> 2. **Instant 1-Click Tenant Impersonation ("Login As Tenant"):** The Super Admin can issue valid authentication sessions for any tenant directly, as all data is indexed by `tenant_id`.
> 3. **Streamlined Tenant Provisioning:** Creating a company immediately inserts into `company_info`, `assignees`, and seeds default stages in the live database.
> 4. **Dedicated Super Admin Tables:** The Super Admin introduces 4 dedicated platform tables (`superadmin_users`, `tenant_subscriptions`, `superadmin_audit_logs`, `platform_settings`) inside the same database, keeping platform management completely decoupled from tenant operations.

### 4.2 Tenant Isolation Model
- Every tenant has a unique identifier formatted as: `company_<slug>` (e.g. `company_acme_corp`).
- Requests from individual tenant users carry:
  1. `Authorization: Bearer pixbe_token_<tenantId>_<timestamp>`
  2. Header: `x-tenant-id: company_<slug>`
- **Super Admin Privilege:** Requests carrying the Super Admin token can access and filter all data without tenant scoping restrictions or pass any target `x-tenant-id` to impersonate.

### 4.3 Dedicated Super Admin Tables (To Be Added to Aurora RDS)

#### A. `superadmin_users` (Platform Operators & Roles)
```sql
CREATE TABLE IF NOT EXISTS superadmin_users (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role VARCHAR(50) DEFAULT 'SUPER_ADMIN', -- 'SUPER_ADMIN' | 'SUPPORT_AGENT' | 'FINANCE_ADMIN'
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  last_login TIMESTAMP WITH TIME ZONE
);
```

#### B. `tenant_subscriptions` (Plan Tiers & Razorpay Ledger)
```sql
CREATE TABLE IF NOT EXISTS tenant_subscriptions (
  id VARCHAR(255) PRIMARY KEY,
  tenant_id VARCHAR(100) NOT NULL REFERENCES company_info(id) ON DELETE CASCADE,
  plan_tier VARCHAR(50) NOT NULL, -- 'Starter', 'Growth', 'Enterprise'
  billing_cycle VARCHAR(20) DEFAULT 'monthly', -- 'monthly', 'annual'
  amount NUMERIC(15, 2) DEFAULT 0,
  currency VARCHAR(10) DEFAULT 'INR',
  status VARCHAR(50) DEFAULT 'ACTIVE', -- 'TRIAL', 'ACTIVE', 'PAST_DUE', 'CANCELLED'
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  max_agents INT DEFAULT 5,
  max_leads_per_month INT DEFAULT 10000,
  ai_credits_balance INT DEFAULT 500,
  razorpay_subscription_id VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_tenant_subscriptions_tenant ON tenant_subscriptions(tenant_id);
```

#### C. `superadmin_audit_logs` (Security & Impersonation Audit Trail)
```sql
CREATE TABLE IF NOT EXISTS superadmin_audit_logs (
  id VARCHAR(255) PRIMARY KEY,
  admin_id VARCHAR(255) NOT NULL,
  admin_email VARCHAR(255) NOT NULL,
  action VARCHAR(100) NOT NULL, -- 'IMPERSONATE_TENANT', 'SUSPEND_TENANT', 'CHANGE_PLAN', 'RUN_MIGRATION'
  target_tenant_id VARCHAR(100),
  ip_address VARCHAR(50),
  details JSONB DEFAULT '{}'::jsonb,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_superadmin_audit_tenant ON superadmin_audit_logs(target_tenant_id);
```

#### D. `platform_settings` (Global Feature Flags & Maintenance)
```sql
CREATE TABLE IF NOT EXISTS platform_settings (
  key VARCHAR(100) PRIMARY KEY,
  value JSONB NOT NULL,
  updated_by VARCHAR(255),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### 4.4 Core Application Tables (AWS Aurora RDS)

#### 1. `company_info`
```sql
CREATE TABLE company_info (
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
```

#### 2. `assignees` (Agents & Telecallers)
```sql
CREATE TABLE assignees (
  id VARCHAR(255) PRIMARY KEY,
  tenant_id VARCHAR(100) DEFAULT 'default_tenant',
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
CREATE INDEX idx_assignees_tenant ON assignees(tenant_id);
```

#### 3. `leads` (Omnichannel Ingestion)
```sql
CREATE TABLE leads (
  id VARCHAR(255) PRIMARY KEY,
  tenant_id VARCHAR(100) DEFAULT 'default_tenant',
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
CREATE INDEX idx_leads_tenant ON leads(tenant_id);
```

#### 4. `reports_call_logs` (Telecaller Activity & Audio Tracking)
```sql
CREATE TABLE reports_call_logs (
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
```

#### 5. `meta_connected_pages` (Multi-Tenant Meta CAPI & Lead Ads Hub)
```sql
CREATE TABLE meta_connected_pages (
  client_id VARCHAR(100) DEFAULT 'default_admin',
  page_id VARCHAR(100) PRIMARY KEY,
  page_name VARCHAR(255) NOT NULL,
  page_access_token TEXT NOT NULL,
  tenant_id VARCHAR(100) DEFAULT 'default_admin',
  crm_user_id VARCHAR(100) DEFAULT 'default_admin',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

#### 6. `permission_templates` (RBAC Definition)
```sql
CREATE TABLE permission_templates (
  id VARCHAR(255) PRIMARY KEY,
  template_name VARCHAR(255) NOT NULL,
  description TEXT,
  is_default BOOLEAN DEFAULT FALSE,
  is_root BOOLEAN DEFAULT FALSE,
  rights JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

#### 7. Additional Platform Tables
- `pipeline_stages`: Custom pipeline configuration per tenant.
- `telephone_call_settings`: Dialer provider, speeds, timeouts, SIP configs.
- `field_settings`: Custom input fields, types, and primary slot mappings (`H1`, `H2`).
- `follow_ups`: Scheduled call reminders.
- `campaigns`: WhatsApp and ad campaign performance metrics.
- `messages`: Omnichannel WhatsApp/SMS chat messages.
- `whatsapp_templates`: Approved WhatsApp Cloud API templates.
- `workflows`: Event-driven automation triggers and actions.
- `drip_schedules`: Timed drip sequence queue items.
- `webhooks`: Inbound/outbound webhook event endpoints.
- `tasks`: CRM user task assignments.
- `activity_logs`: Chronological audit trail.
- `documents_quotes`: Invoices, proposals, quotations with e-signatures.
- `integrations_config`: API credentials for Google Ads, WhatsApp, Zapier.
- `conversion_events`: Meta CAPI & Google Offline Conversion tracking log.
- `ai_sessions`: AI voice qualification & conversational copilot history.

---

## 5. Super Admin Functional Modules & Features

The Super Admin application MUST be organized into the following core navigation sections:

```
┌─────────────────────────────────────────────────────────────┐
│                       PIXBE SUPER ADMIN                      │
├───────────────┬─────────────────────────────────────────────┤
│ NAVIGATION    │ PRIMARY WORKSPACE                           │
│               │                                             │
│ 1. Overview   │ Global Platform KPIs, MRR, Active Tenants   │
│ 2. Tenants    │ Company Directory, Provisioning, "Login As" │
│ 3. Plans & Rev│ Subscriptions, Razorpay Billing, Invoices   │
│ 4. Users      │ Cross-Tenant Agent Directory & Roles        │
│ 5. Database   │ Aurora RDS Diagnostics, Table Summaries     │
│ 6. AI Quotas  │ Gemini / VoiceBot Token Consumptions        │
│ 7. Omnichannel│ Meta Pages, WhatsApp Cloud API & Webhooks   │
│ 8. Audit Logs │ System Event Stream, Security, Config       │
└───────────────┴─────────────────────────────────────────────┘
```

### Module 1: Global Platform Overview (Dashboard)
- **Top Metrics Row:**
  - Total Active Tenants (e.g. 24 Companies, +12% MoM).
  - Total Leads across platform (e.g. 184,290 leads).
  - Total Talk Time & Calls logged today across all dialers.
  - Monthly Recurring Revenue (MRR in `₹`).
  - AWS Aurora RDS Database Status (`Connected - ap-south-2`).
- **Visual Charts (Recharts):**
  - Tenant Growth Trend (Month-over-month).
  - Daily Inbound Leads vs Converted Revenue.
  - Platform Call Volume by Hour.
- **Urgent Action Center:**
  - Tenants with expiring subscriptions within 7 days.
  - Webhooks with delivery failures.
  - High AI token usage spikes.

### Module 2: Tenant & Company Management (Multi-Tenant Engine)
- **Data Table / Cards View of All Tenants:**
  - Company Name & Logo.
  - Tenant ID (`company_<slug>`).
  - Owner / Master Admin Name, Email, Phone.
  - Business Type / Industry (Education, Real Estate, E-commerce, Finance, Healthcare, etc.).
  - Active Plan (Trial, Starter, Growth, Enterprise).
  - Metrics: Total Agents, Total Leads, Converted Revenue.
  - Status: `Active`, `Trial`, `Suspended`, `Archived`.
- **Key Tenant Actions:**
  - 🔑 **Impersonate / "Login as Tenant Admin":** Instantly generates an authorized session token and opens the Pixbe CRM tenant workspace in an iframe or redirect tab.
  - ➕ **Provision New Tenant Modal:** Allows Super Admin to instantly onboard a company by specifying:
    * Company Name, Owner Name, Email, Phone.
    * Business Category / Industry.
    * Initial Plan & License seat count.
    * Default Currency (`INR`, `USD`, `AED`, `EUR`, `GBP`).
    * Automated seeding of default pipeline stages and custom fields.
  - ⚙️ **Edit Tenant Settings:** Quota limits, toggle features (Auto Dialer, WhatsApp CRM, AI VoiceBot, Meta CAPI).
  - ⛔ **Suspend / Reactivate Tenant:** Immediately locks all users under that `tenant_id` from accessing the CRM API.
  - 🗑️ **Wipe / Reset Tenant Data:** Safety-guarded deletion for test accounts.

### Module 3: Subscriptions, Pricing & Razorpay Billing
- **Subscription Tiers Matrix:**
  - **Starter Tier:** Up to 3 Agents, 2,500 Leads/mo, Standard Dialer.
  - **Growth Tier:** Up to 10 Agents, 15,000 Leads/mo, WhatsApp Cloud API, AI Lead Scoring.
  - **Enterprise Tier:** Unlimited Agents, Unlimited Leads, AI VoiceBot, Meta CAPI sync, Dedicated RDS isolation.
- **Transaction History:**
  - View all Razorpay payment records (`tx_<order_id>`).
  - Transaction status: `Paid`, `Created`, `Failed`, `Refunded`.
  - Amount in `₹` (Rupees), receipt ID, tenant ID, and timestamp.
  - Action to issue invoice PDF or manually extend subscription expiration date.

### Module 4: Global Users & Telecallers Directory
- Search and filter all agents across every company on the platform.
- View real-time status (`online`, `on_call`, `break`, `offline`).
- Quick actions: Force password/OTP reset, reassignment, or global account lock.

### Module 5: AWS Aurora RDS Cluster & Health Diagnostics
- **Live Connection Monitor:**
  - Host endpoint (e.g. `database-1.cluster-...ap-south-2.rds.amazonaws.com`).
  - Engine: AWS Aurora RDS PostgreSQL 15+.
  - Dynamic IAM Signer status vs Master Password connection.
  - Pool status: Active connections, idle connections, max pool size.
- **Interactive Database Table Summary Inspector:**
  - Consumes `/api/db/tables`.
  - Displays all 22 database tables with exact live row counts.
  - Column schema viewer (column name, data type).
  - Sample 5-row preview drawer for debugging.
- **Database Tools:**
  - One-click trigger for schema migration (`initializeAwsDbTables`).
  - Test query playground with read-only query guardrails.

### Module 6: AI Usage & Quotas (Google Gemini & VoiceBot)
- Monitors Google GenAI (`@google/genai`) and Gemini 2.0 usage:
  - Lead Scoring calls made per tenant.
  - AI VoiceBot qualification session minutes.
  - Sentiment analysis & call recording transcription minutes.
- Rate-limiting and monthly token budget per tenant to prevent cost overruns.

### Module 7: Omnichannel & Meta / WhatsApp Cloud Gateway
- **Meta Pages Management:**
  - Inspect `meta_connected_pages` across all tenants.
  - Page ID, Page Name, Client/Tenant ID, Access Token validity status.
  - Webhook heartbeat: Verifies Facebook lead ads webhook ingress.
- **WhatsApp Cloud API Health:**
  - Message queue throughput (Delivered vs Read rate).
  - Template approval sync status.

### Module 8: System Security & Audit Trail
- Log every administrative action:
  - Tenant provisioned / edited.
  - Plan changed.
  - Impersonation session started.
  - Database schema executed.
- Global System Banners (e.g. schedule platform maintenance alerts shown to all CRM users).

---

## 6. Super Admin API Contract & Endpoints

The Super Admin backend API exposes the following endpoints (under `/api/superadmin`):

### 6.1 Authentication & Session
- `POST /api/superadmin/auth/login`
  - **Body:** `{ email: string, password: string, mfaCode?: string }`
  - **Returns:** `{ token: string, admin: { id: string, name: string, email: string, role: 'SUPER_ADMIN' } }`
- `GET /api/superadmin/auth/me`
  - Validates Super Admin bearer token.

### 6.2 Tenant Management
- `GET /api/superadmin/tenants`
  - Query params: `?search=&status=&plan=&page=1&limit=25`
  - Returns paginated list of all client companies with aggregated metrics.
- `POST /api/superadmin/tenants`
  - Provisions new tenant in database + seeds default admin and initial state.
- `GET /api/superadmin/tenants/:tenantId`
  - Returns complete tenant profile, owner details, usage statistics, and active licenses.
- `PUT /api/superadmin/tenants/:tenantId`
  - Update company name, plan, status (`ACTIVE` | `SUSPENDED`), or quota limits.
- `POST /api/superadmin/tenants/:tenantId/impersonate`
  - Returns: `{ impersonationToken: string, redirectUrl: string, tenantId: string }`
- `DELETE /api/superadmin/tenants/:tenantId`
  - Soft-archive or hard-purge tenant data.

### 6.3 Financials & Subscriptions
- `GET /api/superadmin/billing/stats`
  - Returns MRR, ARR, active paid subscriptions, churn rate, and monthly revenue graph data.
- `GET /api/superadmin/billing/transactions`
  - Returns all Razorpay order records across all tenants with status and receipts.
- `POST /api/superadmin/billing/manual-plan`
  - Manually grant or extend a tenant's subscription.

### 6.4 AWS Database Telemetry
- `GET /api/db/test`
  - Returns: `{ connected: boolean, engine: string, version: string, serverTime: string }`
- `GET /api/db/tables`
  - Returns: `Array<{ tableName: string, rowCount: number, columns: string[], sampleRows: any[] }>`
- `POST /api/superadmin/db/migrate`
  - Runs database migration queries to ensure latest schema tables exist.

### 6.5 Global AI & Integrations Hub
- `GET /api/superadmin/ai/metrics`
  - Aggregated Gemini API tokens, transcription minutes, and cost estimations.
- `GET /api/superadmin/integrations/meta-pages`
  - Returns all records from `meta_connected_pages` with token health status.

---

## 7. Recommended File & Folder Structure for the Super Admin

When building the Super Admin application, follow this modular, maintainable folder hierarchy:

```
pixbe-super-admin/
├── index.html                    # Root HTML with Poppins, Lora, Open Sans fonts
├── package.json                  # Dependencies (React 19, Vite, Tailwind v4, Lucide, Recharts)
├── tsconfig.json                 # TypeScript compiler options
├── vite.config.ts                # Vite configuration with Tailwind CSS plugin
├── src/
│   ├── main.tsx                  # Application entry point
│   ├── App.tsx                   # Main layout, Router, and Impersonation Header
│   ├── index.css                 # Design tokens, Glassmorphism classes, font rules
│   ├── types/
│   │   ├── superAdmin.ts         # Tenant, Subscription, AuditLog, and Metric interfaces
│   │   └── crmDatabase.ts        # Reusable CRM schemas (leads, agents, stages, etc.)
│   ├── lib/
│   │   ├── api.ts                # Axios/Fetch client with Super Admin Bearer token injection
│   │   └── utils.ts              # Currency formatting (INR), date helpers, status colors
│   ├── context/
│   │   ├── SuperAdminAuthContext.tsx # Global Super Admin authentication state
│   │   └── NotificationContext.tsx   # Toast and alert feedback state
│   ├── components/
│   │   ├── layout/
│   │   │   ├── SuperAdminSidebar.tsx # Collapsible sidebar with active indicators
│   │   │   ├── SuperAdminNavbar.tsx  # Header with system status, search, and admin profile
│   │   │   └── ImpersonationBanner.tsx # Visual reminder when logged in as a tenant
│   │   ├── common/
│   │   │   ├── GlassCard.tsx         # Reusable glassmorphic container
│   │   │   ├── MetricStatWidget.tsx  # KPI counter card with trend badge
│   │   │   ├── StatusPill.tsx        # Styled status badge (Active, Trial, Suspended)
│   │   │   ├── DataTable.tsx         # Searchable, filterable, paginated data grid
│   │   │   └── ConfirmModal.tsx      # High-safety destructive action modal
│   │   ├── dashboard/
│   │   │   ├── PlatformKpiGrid.tsx   # Top overview statistics
│   │   │   ├── RevenueChart.tsx      # MRR / ARR area chart
│   │   │   └── QuickTenantPulse.tsx  # Recent signups and critical alerts
│   │   ├── tenants/
│   │   │   ├── TenantDirectoryView.tsx # Master company list with filters
│   │   │   ├── ProvisionTenantModal.tsx# Step-by-step company onboarding modal
│   │   │   ├── TenantDetailDrawer.tsx  # Deep inspection drawer for a single tenant
│   │   │   └── TenantPlanModal.tsx     # Change plan, adjust seats & quotas
│   │   ├── billing/
│   │   │   ├── BillingOverviewView.tsx # Financial summary and plan distributions
│   │   │   └── TransactionsTable.tsx   # Razorpay payments audit log
│   │   ├── database/
│   │   │   ├── AuroraDbHealthView.tsx  # RDS connection latency, engine version
│   │   │   ├── TableInspectorModal.tsx # Schema and sample row viewer
│   │   │   └── MigrationManager.tsx    # Table creation & verify tool
│   │   ├── ai/
│   │   │   └── AiUsageDashboard.tsx    # Token tracking, quota limits by tenant
│   │   ├── omnichannel/
│   │   │   └── MetaPagesDirectory.tsx  # Global Meta tokens & webhook health
│   │   └── security/
│   │       ├── AuditLogsView.tsx       # Timestamped platform security events
│   │       └── GlobalSettingsView.tsx  # Maintenance mode, feature flags
│   └── views/
│       ├── LoginView.tsx               # Secure Super Admin entry view
│       └── MasterDashboardView.tsx     # Root container coordinating tab views
└── server/
    ├── superadmin.routes.ts            # Express endpoints mounted on main server
    └── superadmin.service.ts           # Business logic querying multiTenantDb & RDS
```

---

## 8. Step-by-Step Implementation Prompt for the AI Agent

Copy and paste the following instruction block directly to the AI agent to initiate code generation:

```markdown
### AGENT INSTRUCTION: BUILD PIXBE CRM SUPER ADMIN APPLICATION

You are an expert full-stack TypeScript engineer tasked with building the **Super Admin Portal** for Pixbe CRM (ARCLE CRM & TeleSales Management).

Please adhere to the following rules:
1. **Design & Aesthetics:**
   - Must use the curated Google Fonts: 'Poppins' for all headings and UI controls, 'Lora' for accents, 'Open Sans' for body text.
   - Use the exact Glassmorphic design system: `.glass-mesh-bg`, `.glass-panel`, `.glass-card`, and `.glass-dropdown`.
   - Use the brand color palette: Primary Indigo (`#4F46E5`), Slate background (`#F8FAFC`), Slate text (`#0F172A`), with Emerald for success and Rose for danger.
   - Currency must be formatted in Indian Rupees (`₹` / INR) with Indian numbering comma separation (e.g. `₹1,50,000`).

2. **Core Capabilities to Implement:**
   - **Super Admin Dashboard:** Live platform KPIs (Total Tenants, Total Platform Leads, Total Calls, MRR, RDS status).
   - **Tenant Directory & Provisioning:** Complete listing of all client companies with search, status filters (Active, Trial, Suspended), a "Provision New Tenant" modal, and a "Login as Tenant" (impersonation) action.
   - **Subscription & Razorpay Ledger:** Revenue analytics, plan tiers (Starter, Growth, Enterprise), and transaction history.
   - **Aurora RDS Database Telemetry:** Real-time database cluster ping, table list with live row counts, and table schema inspector.
   - **AI Quotas & VoiceBot Monitoring:** Gemini 2.0 token tracking and limits per company.
   - **Omnichannel Gateway:** Meta Connected Pages and webhook status.
   - **Audit Logs:** Global activity monitoring.

3. **Code Quality:**
   - Write clean, strongly typed TypeScript with complete interfaces.
   - Do not use mock placeholders or empty functions; provide complete, interactive, functional components.
   - Ensure responsive layout with mobile-safe utility padding (`pt-safe`, `pb-safe`).

Begin by initializing the Super Admin types, styling rules, and layout components!
```

---

## 9. Verification & Quality Checklist

Before deploying or finalizing the Super Admin, verify each item:
- [ ] All fonts (`Poppins`, `Lora`, `Open Sans`) render cleanly without system font fallbacks.
- [ ] Responsive navigation works smoothly on desktop, tablet, and mobile displays.
- [ ] Currency numbers format correctly with `₹` and proper localized grouping.
- [ ] Impersonation workflow safely opens the target tenant workspace with full context.
- [ ] Database health inspector communicates cleanly with `/api/db/test` and `/api/db/tables`.
- [ ] Multi-tenant isolation is strictly maintained across all tenant administrative views.
- [ ] High-impact actions (deleting tenants, wiping data) require explicit two-step confirmation modals.
