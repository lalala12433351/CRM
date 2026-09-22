"""Generate Pixbe CRM AWS implementation plan as PDF."""
from pathlib import Path

from fpdf import FPDF

OUT = Path(__file__).resolve().parents[1] / "docs" / "Pixbe_CRM_AWS_Implementation_Plan.pdf"


def clean(text: str) -> str:
    return (
        text.replace("\u2014", "-")
        .replace("\u2013", "-")
        .replace("\u2018", "'")
        .replace("\u2019", "'")
        .replace("\u201c", '"')
        .replace("\u201d", '"')
        .replace("\u2026", "...")
        .replace("\u2192", "->")
        .replace("\u2265", ">=")
    )


class PlanPDF(FPDF):
    def header(self):
        if self.page_no() == 1:
            return
        self.set_font("Helvetica", "I", 9)
        self.set_text_color(100, 100, 100)
        self.cell(0, 8, "Pixbe CRM - AWS Implementation Plan (ap-south-1)", align="L")
        self.ln(10)

    def footer(self):
        self.set_y(-15)
        self.set_font("Helvetica", "I", 8)
        self.set_text_color(120, 120, 120)
        self.cell(0, 10, f"Page {self.page_no()}/{{nb}}", align="C")


def h1(pdf: PlanPDF, text: str):
    pdf.set_font("Helvetica", "B", 18)
    pdf.set_text_color(20, 20, 20)
    pdf.multi_cell(0, 10, clean(text))
    pdf.ln(2)


def h2(pdf: PlanPDF, text: str):
    pdf.ln(3)
    pdf.set_font("Helvetica", "B", 13)
    pdf.set_text_color(30, 60, 110)
    pdf.multi_cell(0, 8, clean(text))
    pdf.ln(1)


def h3(pdf: PlanPDF, text: str):
    pdf.ln(2)
    pdf.set_font("Helvetica", "B", 11)
    pdf.set_text_color(40, 40, 40)
    pdf.multi_cell(0, 7, clean(text))
    pdf.ln(1)


def body(pdf: PlanPDF, text: str):
    pdf.set_x(pdf.l_margin)
    pdf.set_font("Helvetica", "", 10)
    pdf.set_text_color(30, 30, 30)
    pdf.multi_cell(0, 5.5, clean(text))
    pdf.ln(1)


def bullet(pdf: PlanPDF, text: str):
    pdf.set_x(pdf.l_margin + 4)
    pdf.set_font("Helvetica", "", 10)
    pdf.set_text_color(30, 30, 30)
    pdf.multi_cell(pdf.w - pdf.l_margin - pdf.r_margin - 4, 5.5, clean(f"- {text}"))


def numbered(pdf: PlanPDF, n: int, text: str):
    pdf.set_x(pdf.l_margin + 4)
    pdf.set_font("Helvetica", "", 10)
    pdf.set_text_color(30, 30, 30)
    pdf.multi_cell(pdf.w - pdf.l_margin - pdf.r_margin - 4, 5.5, clean(f"{n}. {text}"))


def table(pdf: PlanPDF, headers: list[str], rows: list[list[str]], col_widths: list[float]):
    pdf.set_x(pdf.l_margin)
    usable = pdf.w - pdf.l_margin - pdf.r_margin
    # normalize widths to page width
    total = sum(col_widths) or 1
    col_widths = [w / total * usable for w in col_widths]

    def row_cells(values: list[str], bold: bool = False, fill: bool = False):
        pdf.set_x(pdf.l_margin)
        pdf.set_font("Helvetica", "B" if bold else "", 8.5)
        if fill:
            pdf.set_fill_color(230, 236, 245)
        # compute max lines
        cleaned = [clean(v) for v in values]
        line_heights = []
        for i, cell in enumerate(cleaned):
            # fpdf multi_cell height estimate via split
            pdf.set_font("Helvetica", "B" if bold else "", 8.5)
            lines = pdf.multi_cell(col_widths[i], 5, cell, dry_run=True, output="LINES")
            line_heights.append(max(len(lines), 1) * 5)
        h = max(line_heights)
        if pdf.get_y() + h > pdf.h - pdf.b_margin:
            pdf.add_page()
        y0 = pdf.get_y()
        x0 = pdf.l_margin
        for i, cell in enumerate(cleaned):
            pdf.set_xy(x0 + sum(col_widths[:i]), y0)
            pdf.multi_cell(col_widths[i], 5, cell, border=1, fill=fill)
        pdf.set_xy(x0, y0 + h)

    row_cells(headers, bold=True, fill=True)
    for row in rows:
        row_cells(row)
    pdf.ln(2)


def main():
    OUT.parent.mkdir(parents=True, exist_ok=True)
    pdf = PlanPDF(format="A4")
    pdf.alias_nb_pages()
    pdf.set_auto_page_break(auto=True, margin=18)
    pdf.set_margins(16, 16, 16)
    pdf.add_page()

    h1(pdf, "Pixbe CRM")
    pdf.set_font("Helvetica", "B", 14)
    pdf.set_text_color(30, 60, 110)
    pdf.multi_cell(0, 8, "Step-by-step AWS Implementation Plan")
    pdf.ln(2)
    body(
        pdf,
        "ECS Fargate + ALB + Cognito + Aurora PostgreSQL (per-workspace databases). "
        "Cloudflare proxy in front of the ALB. Public subnets only (no private subnets / no NAT). "
        "Region: ap-south-1 (Mumbai). No EC2 compute, no Redis, no Zapier.",
    )

    h2(pdf, "1. Locked stack")
    table(
        pdf,
        ["Piece", "Choice"],
        [
            ["Compute", "ECS Fargate (no EC2 app servers)"],
            ["Load balancer", "Application Load Balancer (ALB), no nginx"],
            ["Edge / DNS", "Cloudflare proxy (orange-cloud) in front of ALB"],
            ["Network", "Public subnets only - no private subnets, no NAT gateway"],
            ["Security groups", "Anywhere (0.0.0.0/0) on required ports"],
            ["Auth (humans)", "Amazon Cognito + JWT-only tenant binding"],
            ["Auth (website ingest)", "API keys per workspace (custom HTTP only)"],
            ["Data", "Aurora PostgreSQL: pixbe_control (memberships/billing/API keys) + one DB per workspace (CRM agents/leads)"],
            ["Region", "ap-south-1 (Mumbai)"],
            ["Deferred", "Redis, ECS on EC2, Zapier/Pabbly, TeleCRM Chrome extension"],
        ],
        [45, 145],
    )

    h2(pdf, "2. Architecture (summary)")
    body(
        pdf,
        "Browser and website forms -> Cloudflare proxy -> ALB -> ECS Fargate (public subnets). "
        "Users authenticate with Cognito. App uses RDS Proxy to Aurora also in public subnets. "
        "Aurora hosts pixbe_control (directory/billing/API keys/memberships) and one database per workspace "
        "(e.g. pixbe_company_kite_aviation for CRM data). "
        "Creating a workspace provisions a new workspace DB. It does not become the source of truth for login. "
        "db_company_acme in diagrams is only a fictional second-customer example. "
        "Security groups allow 0.0.0.0/0 (anywhere) on the ports the stack needs.",
    )

    h2(pdf, "3. Where workspace user data is stored")
    body(
        pdf,
        "Admin, Manager, and Telecaller in the same workspace share one workspace database. "
        "They are different roles, not different databases. User data is split: "
        "login identity lives in Cognito; membership lives in the shared control plane; "
        "CRM agent records live in the individual workspace DB.",
    )
    table(
        pdf,
        ["Data", "Where", "Why"],
        [
            [
                "Email, password, Cognito user id",
                "Amazon Cognito",
                "Human auth. Passwords are not stored in either Postgres database.",
            ],
            [
                "Workspace list, billing, API keys, routing",
                "pixbe_control (shared)",
                "Platform directory. Not CRM operational data.",
            ],
            [
                "Membership: user X belongs to workspace Y as Admin / Manager / Telecaller",
                "pixbe_control.memberships",
                "Lets Fargate resolve JWT -> tenant without scanning every workspace DB.",
            ],
            [
                "CRM agent profile: name, phone, manager hierarchy, assignment, call stats",
                "That workspace's database",
                "Same isolated DB as leads, tasks, and calls for that company.",
            ],
        ],
        [52, 48, 90],
    )
    h3(pdf, "How a login works")
    numbered(pdf, 1, "User authenticates with Cognito.")
    numbered(
        pdf,
        2,
        "JWT carries custom:tenant_id and custom:role, or the app looks up membership by Cognito sub in pixbe_control.",
    )
    numbered(
        pdf,
        3,
        "App opens only that workspace DB and loads CRM data (leads, tasks, and the agent row used for assignment).",
    )
    body(pdf, "Practical rules:")
    bullet(pdf, "Can this user enter this workspace, and as which role? -> pixbe_control + Cognito.")
    bullet(pdf, "What this user owns, calls, converts, and reports inside the CRM? -> that workspace's database.")
    bullet(pdf, "Do not store passwords in the workspace DB.")
    bullet(pdf, "Do not put leads, tasks, or call logs in pixbe_control.")
    bullet(pdf, "Signup flow: Cognito sign-up -> provision tenant/workspace DB -> write membership in pixbe_control.")

    h2(pdf, "4. What to create first - and why")
    body(pdf, "Order: Database (local then Aurora) -> Cognito -> API keys -> Server (Fargate).")
    table(
        pdf,
        ["Order", "Create", "Why"],
        [
            [
                "1st",
                "Database layer",
                "JSON today; need SQL + per-workspace DBs before Cognito signup or multi-task Fargate.",
            ],
            [
                "2nd",
                "Cognito",
                "Needs control-plane memberships / tenant_id in JWT. Auth before DB has nowhere to attach workspaces.",
            ],
            [
                "3rd",
                "API keys + ingest",
                "Stored in control plane; writes into workspace DB. Testable without Fargate.",
            ],
            [
                "4th",
                "ECS Fargate + ALB",
                "Needs DB endpoints, Cognito IDs, secrets. Deploying server first with JSON/sessions causes rework.",
            ],
        ],
        [18, 42, 130],
    )
    body(pdf, "Benefits of this order:")
    bullet(pdf, "Fail fast on JSON->SQL before paying for always-on AWS.")
    bullet(pdf, "Auth/tenancy correct before running 2+ containers behind ALB.")
    bullet(pdf, "Clear exit test per step.")
    bullet(pdf, "Cutover is mostly DNS + data import.")

    h2(pdf, "5. Step-by-step process")

    h3(pdf, "Step 1 - Local database + app rewrite (first)")
    body(pdf, "Goal: Postgres with control plane + one DB per workspace on Docker Compose.")
    numbered(pdf, 1, "CREATE DATABASE pixbe_control and pixbe_<tenant> scripts.")
    numbered(
        pdf,
        2,
        "Migrations: control plane (tenants, memberships, api_keys, routing) + workspace schema "
        "(agents, leads, tasks, calls). Memberships stay in pixbe_control; agent CRM profiles stay in the workspace DB.",
    )
    numbered(pdf, 3, "Implement controlPlane.ts, tenantPool.ts, provisionTenant.ts.")
    numbered(pdf, 4, "Rewrite multiTenantDb to use tenant pool (not JSON file).")
    numbered(pdf, 5, "JSON -> Postgres import script per tenant.")
    numbered(pdf, 6, "Prove: compose up, create tenant, leads CRUD, /api/health.")
    body(pdf, "Benefit: Zero AWS cost; same path as Aurora. Exit: no production path on multi_tenant_store.json.")

    h3(pdf, "Step 2 - AWS network foundation (ap-south-1)")
    body(
        pdf,
        "Goal: Public-subnet VPC for Aurora and Fargate in Mumbai. "
        "No private subnets and no NAT gateway. Cloudflare sits in front of the ALB.",
    )
    numbered(pdf, 1, "VPC, 2 AZs, public subnets only (no private subnets, no NAT).")
    numbered(
        pdf,
        2,
        "Security groups with Anywhere (0.0.0.0/0): ALB 80/443 from 0.0.0.0/0; "
        "app 8080 from 0.0.0.0/0 (or from ALB SG if preferred later); "
        "Aurora/Proxy 5432 from 0.0.0.0/0; HTTPS egress allowed.",
    )
    numbered(pdf, 3, "ACM certificate for the origin domain the ALB presents to Cloudflare.")
    numbered(pdf, 4, "IAM roles for ECS task execution and task role.")
    numbered(
        pdf,
        5,
        "Cloudflare: add DNS A/CNAME to ALB, enable proxy (orange cloud), SSL/TLS Full (strict) once ACM is valid.",
    )
    body(
        pdf,
        "Benefit: Simpler network for this stage; edge TLS and DDoS via Cloudflare. "
        "Exit: VPC + SGs + Cloudflare DNS ready, no app deployed yet.",
    )

    h3(pdf, "Step 3 - Aurora (cloud database)")
    body(pdf, "Goal: Same DB model as Step 1 on AWS.")
    numbered(pdf, 1, "Aurora PostgreSQL (Serverless v2 OK) in public subnets (no private subnets).")
    numbered(pdf, 2, "RDS Proxy + Secrets Manager.")
    numbered(pdf, 3, "SG for Postgres: allow 5432 from Anywhere 0.0.0.0/0 (per locked stack).")
    numbered(pdf, 4, "Create pixbe_control; run migrations.")
    numbered(pdf, 5, "Provision test workspace DB; import sample tenant.")
    numbered(pdf, 6, "Point app at Aurora with SSL.")
    body(pdf, "Benefit: Durable data before auth/server. Why not Cognito/Fargate yet: signup creates DBs; Fargate needs secrets.")

    h3(pdf, "Step 4 - Cognito + JWT-only tenant binding")
    body(pdf, "Goal: Humans use Cognito; tenant only from verified JWT.")
    numbered(pdf, 1, "User Pool + App Client (SPA + PKCE).")
    numbered(
        pdf,
        2,
        "custom:tenant_id, custom:role and/or memberships by Cognito sub in pixbe_control.memberships.",
    )
    numbered(
        pdf,
        3,
        "Register: Cognito sign-up -> provisionTenant (new workspace DB) -> membership row in pixbe_control "
        "(role Admin / Manager / Telecaller) -> agent row in that workspace DB.",
    )
    numbered(pdf, 4, "Replace session Map with JWT verify (JWKS).")
    numbered(pdf, 5, "Stop trusting bare x-tenant-id; allow only with membership proof.")
    numbered(pdf, 6, "Update client auth; real Navbar workspace switch.")
    numbered(pdf, 7, "Disable hardcoded demo admin in production.")
    body(pdf, "Benefit: Stateless auth for multi-task Fargate; no header spoofing.")

    h3(pdf, "Step 5 - API keys (website / custom HTTP only)")
    body(pdf, "Goal: Website forms or custom backends push leads. Zapier/Pabbly out of scope.")
    numbered(pdf, 1, "api_keys table - store hash only; show raw key once.")
    numbered(pdf, 2, "Admin UI: create / revoke / rotate.")
    numbered(pdf, 3, "POST /api/v1/ingest/leads with Bearer pk_... or X-Api-Key.")
    numbered(pdf, 4, "Resolve key -> tenant -> workspace DB; audit without full PII.")
    numbered(pdf, 5, "Short docs for calling ingest from your site/server.")
    body(pdf, "Exit: API key creates a lead only in that workspace DB.")

    h3(pdf, "Step 6 - Container image (ECR)")
    numbered(pdf, 1, "ECR repo pixbe-crm in ap-south-1.")
    numbered(pdf, 2, "Build Dockerfile; healthcheck /api/health.")
    numbered(pdf, 3, "Push version tag and latest.")

    h3(pdf, "Step 7 - ALB + ECS Fargate (server last)")
    body(pdf, "Goal: Public HTTPS on Fargate behind Cloudflare - no EC2, no private subnets.")
    numbered(
        pdf,
        1,
        "ALB in public subnets; HTTPS + ACM; SG allows 80/443 from Anywhere 0.0.0.0/0; "
        "target group port 8080; health /api/health.",
    )
    numbered(pdf, 2, "ECS cluster + Fargate task (ECR image; secrets for DB, Cognito, Gemini, Meta, Razorpay).")
    numbered(
        pdf,
        3,
        "Service desired count 2+, public subnets only, assign public IPs as needed, attached to ALB. "
        "Task SG: 8080 from Anywhere 0.0.0.0/0 (locked stack).",
    )
    numbered(pdf, 4, "Optional SQS worker for Meta webhooks / workflows.")
    numbered(pdf, 5, "CloudWatch. Prefer Cloudflare proxy for edge protection instead of AWS WAF for now.")
    body(
        pdf,
        "Why last: Needs Steps 3-6. Exit: https://your-domain/api/health OK via Cloudflare; "
        "Cognito + API-key ingest via Cloudflare -> ALB.",
    )

    h3(pdf, "Step 8 - Data cutover + go-live")
    numbered(pdf, 1, "Freeze or final-export JSON.")
    numbered(pdf, 2, "Import all tenants; verify counts.")
    numbered(
        pdf,
        3,
        "Point Cloudflare DNS at the ALB (proxied / orange cloud). Confirm SSL mode Full (strict).",
    )
    numbered(pdf, 4, "Smoke: Cognito, leads, Meta webhook, API-key ingest, health through Cloudflare.")
    numbered(pdf, 5, "Keep JSON backup for short rollback window.")
    numbered(pdf, 6, "Retire EB zip / JSON as primary path.")

    h3(pdf, "Step 9 - Later (not blocking go-live)")
    body(
        pdf,
        "TeleCRM parity later: one IVR/telephony vendor, WhatsApp Cloud API depth, "
        "IndiaMART/Justdial-style connectors.",
    )

    h2(pdf, "6. Printable checklist")
    for line in [
        "[ ] 1. Local Postgres + control plane + per-workspace DBs + memberships vs agents split + multiTenantDb SQL + import",
        "[ ] 2. VPC public subnets only + SGs 0.0.0.0/0 + ACM + Cloudflare proxy DNS (ap-south-1)",
        "[ ] 3. Aurora (public subnets) + RDS Proxy + Secrets (+ test tenant)",
        "[ ] 4. Cognito + JWT-only tenant binding (+ workspace switch)",
        "[ ] 5. API keys + /api/v1/ingest (website/custom HTTP)",
        "[ ] 6. ECR image push",
        "[ ] 7. ALB + ECS Fargate in public subnets (+ SQS workers)",
        "[ ] 8. Import + Cloudflare DNS cutover + smoke tests",
        "[ ] 9. (Later) TeleCRM feature parity",
    ]:
        bullet(pdf, line)

    h2(pdf, "7. Key files")
    bullet(pdf, "server/services/multiTenantDb.ts")
    bullet(pdf, "server/middleware/auth.ts, tenantContext.ts")
    bullet(pdf, "src/lib/auth.ts, Navbar.tsx")
    bullet(pdf, "New: server/db/*, server/modules/apiKeys/*, server/modules/ingest/*")
    bullet(pdf, "docker-compose.yml")
    bullet(
        pdf,
        "New infra/: VPC (public only), Aurora, Proxy, Cognito, ECR, ALB, ECS Fargate, SQS, Secrets, Cloudflare DNS",
    )

    h2(pdf, "8. Out of scope now")
    bullet(pdf, "EC2 for compute or as load balancer")
    bullet(pdf, "Private subnets and NAT gateway")
    bullet(pdf, "Redis")
    bullet(pdf, "Zapier / Pabbly")
    bullet(pdf, "One Aurora cluster per customer")
    bullet(pdf, "Full TeleCRM Chrome extension in Step 8")
    bullet(pdf, "Region ap-south-2 - use ap-south-1 Mumbai only")

    pdf.output(str(OUT))
    print(f"Wrote {OUT}")


if __name__ == "__main__":
    main()
