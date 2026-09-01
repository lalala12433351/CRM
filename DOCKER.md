# 🐳 Pixbe CRM - Dockerization & Deployment Guide

This guide covers running, developing, and deploying **Pixbe CRM** inside Docker containers.

---

## 📋 Table of Contents
- [Architecture Overview](#architecture-overview)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Database Configuration Modes](#database-configuration-modes)
  - [Mode A: Local PostgreSQL Container (Default)](#mode-a-local-postgresql-container-default)
  - [Mode B: Remote AWS Aurora RDS PostgreSQL](#mode-b-remote-aws-aurora-rds-postgresql)
- [Docker Compose Workflows](#docker-compose-workflows)
  - [Production Stack](#production-stack)
  - [Development Stack (Live Reload)](#development-stack-live-reload)
- [Data Persistence](#data-persistence)
- [Healthchecks & Diagnostics](#healthchecks--diagnostics)
- [Common Commands & Maintenance](#common-commands--maintenance)
- [Production Cloud Deployment](#production-cloud-deployment)

---

## 🏗️ Architecture Overview

The containerized Pixbe CRM stack consists of:

```
                  ┌─────────────────────────────────────┐
                  │          Client / Browser           │
                  └──────────────────┬──────────────────┘
                                     │ :8080
                                     ▼
        ┌─────────────────────────────────────────────────────────┐
        │ Docker Container: pixbe-crm-app                         │
        │ ┌─────────────────────────────────────────────────────┐ │
        │ │ Express.js Server (node dist/server.cjs)            │ │
        │ │  ├─ Serves React 19 Vite Production SPA             │ │
        │ │  ├─ REST API Endpoints (/api/leads, /api/auth, ...)  │ │
        │ │  ├─ Meta / Google Ad Integrations                   │ │
        │ │  ├─ Gemini AI Engine                                │ │
        │ │  └─ Multi-Tenant Data Store (/app/.data)            │ │
        │ └─────────────────────────┬───────────────────────────┘ │
        └───────────────────────────┼─────────────────────────────┘
                                    │ SQL Queries (5432)
                                    ▼
        ┌─────────────────────────────────────────────────────────┐
        │ Option 1: Docker Container 'pixbe-crm-db' (Postgres 16) │
        │ Option 2: AWS Aurora RDS PostgreSQL Cluster             │
        └─────────────────────────────────────────────────────────┘
```

- **Builder Stage**: Compiles React 19 with Vite and packages the Express backend with esbuild into a single high-performance executable bundle (`dist/server.cjs`).
- **Runner Stage**: Ultra-lightweight `node:20-alpine` image running under an unprivileged `node` user with integrated health checks.
- **Database**: PostgreSQL 16 Alpine container with persistent volume storage and automated schema migrations.

---

## ⚡ Prerequisites

Ensure you have Docker and Docker Compose installed:
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (Windows / macOS) or Docker Engine + Docker Compose (Linux).
- Verify installation:
  ```bash
  docker --version
  docker compose version
  ```

---

## 🚀 Quick Start

1. **Clone or navigate to the repository:**
   ```bash
   cd "Pixbe Crm"
   ```

2. **Copy the Docker environment template:**
   ```bash
   cp .env.docker.example .env
   ```

3. **Start the complete stack with Docker Compose:**
   ```bash
   docker compose up -d --build
   ```
   *Alternatively, run with npm:*
   ```bash
   npm run docker:up
   ```

4. **Open Pixbe CRM in your browser:**
   ```
   http://localhost:8080
   ```

5. **Verify system health:**
   ```bash
   curl http://localhost:8080/api/health
   # Returns: {"status":"ok","app":"Pixbe CRM",...}
   ```

---

## 🗄️ Database Configuration Modes

Pixbe CRM supports two database modes out of the box:

### Mode A: Local PostgreSQL Container (Default)
In `docker-compose.yml`, the application connects automatically to the included `db` service container.
Your `.env` settings:
```env
DB_HOST=db
DB_PORT=5432
DB_NAME=pixbe_crm
DB_USER=postgres
DB_PASSWORD=postgres
DB_SSL=false
```
Tables and default tenant data are initialized automatically upon startup.

### Mode B: Remote AWS Aurora RDS PostgreSQL
To connect to an AWS Aurora RDS cluster instead of the local Postgres container:
1. Update your `.env` with your AWS RDS credentials:
   ```env
   AWS_RDS_HOST=database-1.cluster-cvwo02ecys5c.ap-south-2.rds.amazonaws.com
   AWS_RDS_PORT=5432
   AWS_RDS_DATABASE=postgres
   AWS_RDS_USER=postgres
   AWS_RDS_PASSWORD=your_password
   AWS_RDS_SSL=true
   AWS_REGION=ap-south-2
   AWS_ACCESS_KEY_ID=your_key_id
   AWS_SECRET_ACCESS_KEY=your_secret_key
   ```
2. Start the app container without the local database if desired:
   ```bash
   docker compose up -d app
   ```

---

## 🛠️ Docker Compose Workflows

### Production Stack
Builds the optimized production image and launches the application alongside PostgreSQL:
```bash
# Build and start in background
docker compose up -d --build

# View live application logs
docker compose logs -f app

# Stop containers
docker compose down
```

### Development Stack (Live Reload)
Mounts your local source code into the container so that file changes in `src/` or `server/` trigger instant live reload / HMR:
```bash
# Start development environment
docker compose -f docker-compose.dev.yml up --build

# Or via npm shortcut
npm run docker:dev
```

---

## 💾 Data Persistence

Pixbe CRM uses named Docker volumes to guarantee zero data loss:

| Volume Name | Target Inside Container | Purpose |
| :--- | :--- | :--- |
| `pixbe_app_data` | `/app/.data` | Persists multi-tenant JSON stores, field configurations, agent states, and local audit logs. |
| `pixbe_postgres_data` | `/var/lib/postgresql/data` | Persists PostgreSQL database schemas, leads, calls, workflows, and relational tables. |

To inspect volumes:
```bash
docker volume ls
```

---

## 🩺 Healthchecks & Diagnostics

The application includes built-in endpoints for container orchestration (Kubernetes, AWS ECS, Docker Compose):

| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/api/health` | `GET` | Container liveness probe used by Docker `HEALTHCHECK`. Returns `200 OK`. |
| `/api/db/test` | `GET` | Tests active SQL connection to Postgres / AWS RDS and returns database version. |
| `/api/db/seed` | `GET` | Seeds mock leads, agents, and pipelines into the SQL database. |
| `/api/db/tables` | `GET` | Inspects all provisioned tables and row counts in PostgreSQL. |

Example test:
```bash
# Check database connectivity
curl http://localhost:8080/api/db/test
```

---

## 🔧 Common Commands & Maintenance

### Access PostgreSQL CLI
```bash
docker compose exec db psql -U postgres -d pixbe_crm
```

### Inspect Database Tables
```sql
\dt
SELECT count(*) FROM leads;
```

### Rebuild from Scratch
If dependencies change or you need a clean build:
```bash
docker compose down
docker compose build --no-cache
docker compose up -d
```

### Reset All Data (Caution: Clears Volumes)
```bash
docker compose down -v
```

---

## ☁️ Production Cloud Deployment

### 1. AWS Elastic Container Service (ECS / Fargate)
1. Build and push the image to AWS ECR:
   ```bash
   aws ecr get-login-password --region <region> | docker login --username AWS --password-stdin <aws_account_id>.dkr.ecr.<region>.amazonaws.com
   docker build -t pixbe-crm .
   docker tag pixbe-crm:latest <aws_account_id>.dkr.ecr.<region>.amazonaws.com/pixbe-crm:latest
   docker push <aws_account_id>.dkr.ecr.<region>.amazonaws.com/pixbe-crm:latest
   ```
2. Create an ECS Task Definition mapping port `8080` with environment variables for AWS Aurora RDS.

### 2. Google Cloud Run
```bash
gcloud builds submit --tag gcr.io/<PROJECT_ID>/pixbe-crm
gcloud run deploy pixbe-crm \
  --image gcr.io/<PROJECT_ID>/pixbe-crm \
  --platform managed \
  --port 8080 \
  --allow-unauthenticated
```

### 3. VPS / Linux Server (Docker Compose)
1. Clone the repo onto your server.
2. Configure `.env`.
3. Run `docker compose up -d`.
4. Put Nginx or Caddy in front as a reverse proxy with SSL (Let's Encrypt).
