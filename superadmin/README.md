# Pixbe CRM - Super Admin Application

Enterprise-grade SaaS Command Center for **Pixbe CRM** (ARCLE CRM & TeleSales Management Platform).

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
Ensure your `.env` contains the AWS Aurora RDS PostgreSQL credentials:
```env
AWS_RDS_HOST=database-1.cluster-cvwo02ecys5c.ap-south-2.rds.amazonaws.com
AWS_RDS_PORT=5432
AWS_RDS_DATABASE=postgres
AWS_RDS_USER=postgres
AWS_RDS_PASSWORD=your_password
PORT=5174
```

### 3. Run Locally
```bash
npm run dev
```
Open **`http://localhost:5174`** in your browser.

---

## 🌟 Super Admin Modules Included

1. **Platform Overview Dashboard:**
   - Real-time KPIs: Total Tenants, Active Subscriptions, Total Platform Leads, Calls Made Today, Audio Talk Time, and Monthly Recurring Revenue (MRR in `₹`).
   - Recharts visual analytics: Revenue Growth Trend (last 6 months) & Dialer Call Volume by Hour.

2. **Tenants Directory & Management:**
   - Filterable, searchable table of all client companies.
   - Status filters (`Active`, `Trial`, `Suspended`).
   - 1-Click **"Login As" (Impersonation)** to access and troubleshoot any tenant's workspace.
   - Provision New Tenant modal (onboards company, admin contact, industry, plan tier, and default currency).
   - Instant Suspend / Activate toggle.

3. **Subscriptions & Billing Ledger:**
   - Plan tiers (Starter ₹1,999/mo, Growth ₹4,999/mo, Enterprise ₹14,999/mo).
   - Active subscription allocations and renewals.

4. **AWS Aurora RDS Database Cluster:**
   - Live cluster telemetry in region `ap-south-2` with dynamic latency ping.
   - Live row counts across all 26 schema tables.
   - Interactive schema inspector modal.
   - One-click schema verification and migration.

5. **Global Users & Telecallers Directory:**
   - Unified directory of sales counselors, telecallers, and administrators across all companies.

6. **AI Token Quotas & Usage:**
   - Per-company Google Gemini 2.0 token tracker.
   - AI VoiceBot session minutes usage and limits.

7. **Omnichannel Gateway:**
   - Global Meta Connected Pages (`meta_connected_pages`) token status and webhook monitor.

8. **Platform Security & Audit Trail:**
   - Immutable log of administrative actions, impersonations, and migrations.
