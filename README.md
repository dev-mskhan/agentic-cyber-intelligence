# SentinelWatch

**Automated cybersecurity intelligence for teams without a dedicated security analyst.**

SentinelWatch is a multi-tenant SaaS platform that continuously monitors a company's declared technology stack for relevant threats and vulnerabilities. Instead of generic threat feeds, it matches real CVEs and active exploit data against what a company actually runs, then uses a pipeline of AI agents to produce prioritized, executive-ready security reports — on demand or on a recurring schedule.

---

## What it does

1. **Onboarding** — a company declares its industry, compliance requirements, and technology inventory (products, versions, environment, criticality).
2. **Analysis** — a four-stage AI agent pipeline runs against that inventory:
   - **Threat Intelligence Analyst** — searches the web and threat intel feeds for news relevant to the company's industry
   - **Vulnerability Researcher** — matches declared products/versions against NVD's CVE database and CISA's Known Exploited Vulnerabilities catalog
   - **Incident Response Advisor** — reasons over the findings to recommend mitigations, weighted by the business criticality of affected systems
   - **Report Writer** — synthesizes everything into an executive summary with an overall risk rating and compliance-aware phrasing
3. **Delivery** — reports are generated on-demand or on a schedule tied to the subscription plan, with live progress updates, structured email notifications to subscribed team members, and a full report viewer with threats, vulnerabilities, and actionable mitigations.

---

## Tech Stack

**Backend**
- Node.js + TypeScript + Express 5
- MongoDB + Mongoose (replica set, for multi-document transactions)
- Redis — caching, BullMQ job queues, Socket.IO pub/sub bridging
- BullMQ — background job processing and scheduled/repeatable runs
- Socket.IO — real-time run status and notification events
- LangGraph + LangChain — multi-agent orchestration with shared state
- Zod — request validation, matched 1:1 with frontend validation
- Stripe — subscription billing, checkout, customer portal, webhooks
- Pino — structured logging

**Frontend**
- React + TypeScript + Vite
- Tailwind CSS v4
- Redux Toolkit + RTK Query
- React Hook Form + Zod
- Recharts — data visualization
- Socket.IO client — live updates

**External data sources**
- NVD (National Vulnerability Database) — CVE lookups, CPE matching
- CISA KEV — actively exploited vulnerability catalog
- Exa — AI-native web search for threat intelligence
- AlienVault OTX — threat intel pulses

---

## Architecture highlights

- **Multi-tenant by design** — every resource is scoped to an `organizationId` derived from the authenticated user's session, never trusted from client input.
- **Role-based access control** — three roles (Admin, Analyst, Viewer) enforced at the route level across billing, team management, inventory editing, and run triggering.
- **Agent pipeline as a LangGraph state machine** — each node reads and writes to shared graph state, with Zod schemas validating every node's output before it's persisted.
- **Queue-based execution** — report generation runs entirely off the request/response cycle via BullMQ workers, with retry policies, per-run error logging, and Redis-cached external API responses to respect rate limits.
- **Event-driven real-time layer** — domain events (run completed, report generated, email sent/failed, mitigation updated) are published to Redis and rebroadcast via Socket.IO to the relevant organization or user room, with REST-based reconciliation on every (re)connect so the UI is never solely dependent on live event delivery.
- **Stripe-backed billing** — self-serve checkout, webhook-driven subscription state sync, and usage limits (runs per month) tied to plan tier.

---

## Getting Started

### Prerequisites

- Node.js 20+
- MongoDB (running as a replica set — required for multi-document transactions)
- Redis
- Stripe account (test mode is fine)
- API keys: NVD, Exa, AlienVault OTX, Google Gemini (or your chosen LLM provider)

### Environment Variables

Create a `.env` file in `/server`:

```env
# Server
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:3000

# Database
MONGO_URI=mongodb://127.0.0.1:27017/sentinelwatch?replicaSet=rs0
REDIS_URL=redis://localhost:6379

# Auth
COOKIE_SECRET=
JWT_SCOPED_SOCKET_SECRET=
GOOGLE_CLIENT_ID=

# Stripe
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PRICE_STARTER=
STRIPE_PRICE_PRO=
STRIPE_PRICE_ENTERPRISE=

# External APIs
NVD_API_KEY=
EXA_API_KEY=
OTX_API_KEY=
GOOGLE_GENAI_API_KEY=

# Email (SMTP)
SMTP_HOST=
SMTP_PORT=
SMTP_SECURE=
SMTP_USER=
SMTP_PASS=
SMTP_FROM=
```

### Backend setup

```bash
cd server
npm install

# MongoDB must be running as a replica set for transactions to work.
# For local Docker: docker run -d --name mongo -p 27017:27017 mongo:7 --replSet rs0
# Then initialize once: docker exec -it mongo mongosh --eval "rs.initiate()"

npm run dev          # API server + background workers
```

### Frontend setup

```bash
cd client
npm install
npm run dev
```

### Stripe webhooks (local development)

```bash
stripe login
stripe listen --forward-to localhost:5000/api/webhooks/stripe
```

### Seed the technology catalog (optional, improves autocomplete)

```bash
npm run seed:catalog
```

---

## Project Structure

```
server/
  src/
    agents/          # LangGraph state definition + the four agent nodes
    tools/            # External API clients (NVD, CISA KEV, Exa, OTX) + Redis caching
    config/            # DB, Redis, Stripe, Socket.IO, logger, env
    models/            # Mongoose schemas
    repositories/       # Data access layer
    services/           # Business logic
    controllers/         # Request/response handling
    routes/               # Express route definitions
    middlewares/           # Auth, RBAC, validation, error handling
    validations/             # Zod schemas
    jobs/                     # BullMQ queues + workers
    events/                    # Domain event bus (Redis pub/sub → Socket.IO)
    utils/                      # Shared helpers

client/
  src/
    api/              # RTK Query API slices, one per resource
    app/               # Redux store, socket middleware
    features/            # Feature-scoped components + Zod schemas
    components/            # Shared UI primitives, layout, charts
    pages/                   # Route-level page components
    lib/                      # Socket client, utilities
```

---

## Roles & Permissions

| Role | Billing | Team Mgmt | Inventory | Trigger Runs | View Reports |
|---|---|---|---|---|---|
| **Admin** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Analyst** | ❌ | ❌ | ✅ | ✅ | ✅ |
| **Viewer** | ❌ | ❌ | ❌ | ❌ | ✅ (read-only) |

---

## License

Private project — all rights reserved.