# Render + Atlas Deployment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Publish UniMove at a public HTTPS WebUI, publish both Docker images to public GHCR packages, and retain minimal truthful course evidence.

**Architecture:** Render serves the React build as a Static Site and runs the Express backend from its Dockerfile. The backend connects over TLS to a MongoDB Atlas Free Cluster; GitHub Actions independently publishes immutable frontend and backend images to GHCR after `main` passes CI.

**Tech Stack:** React 19, Vite 7, Express 4, MongoDB Atlas, Render Blueprint, Docker Buildx, GitHub Actions, GHCR, Node 22 built-in test runner.

## Global Constraints

- Do not refactor UI, domain models, or existing API behavior.
- Keep production seed disabled; do not add a seed endpoint or fixed demo credentials.
- Never write real `JWT_SECRET`, `MONGODB_URI`, database passwords, or Render credentials to files, logs, commits, or chat.
- Use Render-managed HTTPS and an exact `FRONTEND_URL` CORS origin.
- Prefer Atlas access-list entries for Render's published outbound addresses; do not default to `0.0.0.0/0`.
- Keep the Shanghai ECS unchanged and out of the public deployment.
- Documentation stays minimal, but `REFLECTION.md` remains student-authored and must meet the course length requirement.
- Configuration and distribution land on `main` before external provisioning; exact deployment evidence lands in a second, small PR after URLs exist.

---

### Task 1: Render deployment contract

**Files:**
- Create: `scripts/deployment-contract.test.mjs`
- Create: `render.yaml`
- Modify: `backend/Dockerfile`
- Modify: `package.json`

**Interfaces:**
- Consumes: backend `PORT`, `MONGODB_URI`, `JWT_SECRET`, `FRONTEND_URL`; frontend `VITE_API_URL`; backend `/api/health`.
- Produces: two Render services named `unimove-ezio927-web` and `unimove-ezio927-api`, plus `npm run test:deployment`.

- [ ] **Step 1: Write the failing deployment contract test**

Create `scripts/deployment-contract.test.mjs` with Node's built-in test runner. The assertions must read repository files without adding a YAML dependency:

```js
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const read = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

test('Render blueprint declares the public frontend and API without committed secrets', () => {
  const blueprint = read('render.yaml');
  assert.match(blueprint, /name: unimove-ezio927-web[\s\S]*runtime: static/);
  assert.match(blueprint, /source: \/\*[\s\S]*destination: \/index\.html[\s\S]*type: rewrite/);
  assert.match(blueprint, /name: unimove-ezio927-api[\s\S]*runtime: docker/);
  assert.match(blueprint, /healthCheckPath: \/api\/health/);
  assert.match(blueprint, /key: MONGODB_URI\s+sync: false/);
  assert.match(blueprint, /key: FRONTEND_URL\s+sync: false/);
  assert.doesNotMatch(blueprint, /mongodb(?:\+srv)?:\/\/[^\s]+@/i);
});

test('backend container healthcheck honors the platform PORT', () => {
  assert.match(read('backend/Dockerfile'), /process\.env\.PORT\s*\|\|\s*3001/);
});
```

- [ ] **Step 2: Run the test and record RED**

Run: `node --test scripts/deployment-contract.test.mjs`  
Expected: FAIL because `render.yaml` does not exist.

- [ ] **Step 3: Add the minimal Render Blueprint**

Create `render.yaml` with no real secret values:

```yaml
services:
  - type: web
    name: unimove-ezio927-web
    runtime: static
    rootDir: frontend
    buildCommand: npm ci && npm run build
    staticPublishPath: ./dist
    autoDeployTrigger: checksPass
    envVars:
      - key: VITE_API_URL
        sync: false
    routes:
      - type: rewrite
        source: /*
        destination: /index.html

  - type: web
    name: unimove-ezio927-api
    runtime: docker
    plan: free
    region: singapore
    rootDir: backend
    autoDeployTrigger: checksPass
    healthCheckPath: /api/health
    envVars:
      - key: NODE_ENV
        value: production
      - key: JWT_SECRET
        generateValue: true
      - key: JWT_EXPIRES_IN
        value: 7d
      - key: MONGODB_URI
        sync: false
      - key: FRONTEND_URL
        sync: false
```

Update the backend Docker healthcheck so it follows Render's injected port while retaining local port 3001:

```dockerfile
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "const port = process.env.PORT || 3001; fetch('http://localhost:' + port + '/api/health').then((response) => { if (!response.ok) process.exit(1); }).catch(() => process.exit(1));"
```

Add to root `package.json`:

```json
"test:deployment": "node --test scripts/deployment-contract.test.mjs",
"test": "npm run test:deployment && npm run test:backend && npm run test:frontend"
```

- [ ] **Step 4: Run GREEN and regression gates**

Run: `npm run test:deployment`  
Expected: 2 tests PASS.

Run: `npm test`  
Expected: deployment contract, backend, and frontend tests all PASS.

Run with process-local dummy values: `docker compose config` and `docker compose -f docker-compose.yml -f docker-compose.tools.yml config`  
Expected: both exit 0; do not print rendered secrets to the report.

- [ ] **Step 5: Request scoped review and commit**

Reviewer checks Render schema fields against the current official Blueprint reference, confirms no credential value is committed, and reports Critical/Important findings separately.

```bash
git add scripts/deployment-contract.test.mjs render.yaml backend/Dockerfile package.json
git commit -m "build: add Render deployment contract"
```

---

### Task 2: Public GHCR image publishing

**Files:**
- Modify: `scripts/deployment-contract.test.mjs`
- Modify: `.github/workflows/ci.yml`
- Modify: `README.md`

**Interfaces:**
- Consumes: existing `frontend/Dockerfile`, `backend/Dockerfile`, and GitHub-provided `GITHUB_TOKEN`.
- Produces: public packages `ghcr.io/ezio927/unimove-frontend` and `ghcr.io/ezio927/unimove-backend`, tagged with commit SHA and `latest` only on successful `main` pushes.

- [ ] **Step 1: Extend the contract test and record RED**

Append:

```js
test('GitHub CI publishes both images with least package permission', () => {
  const workflow = read('.github/workflows/ci.yml');
  assert.match(workflow, /packages: write/);
  assert.match(workflow, /ghcr\.io\/ezio927\/unimove-/);
  assert.match(workflow, /docker\/login-action@v3/);
  assert.match(workflow, /push: \$\{\{ github\.event_name == 'push' && github\.ref == 'refs\/heads\/main' \}\}/);
});
```

Run: `npm run test:deployment`  
Expected: FAIL because CI has no registry login, package permission, tags, or push condition.

- [ ] **Step 2: Replace the Docker validation job with a two-component matrix**

Keep pull requests build-only and let only `main` pushes authenticate and publish. The job must contain these exact semantics:

```yaml
  docker-build:
    name: Docker build (${{ matrix.component }})
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write
    strategy:
      matrix:
        component: [backend, frontend]
    steps:
      - uses: actions/checkout@v4
      - uses: docker/setup-buildx-action@v3
      - name: Log in to GHCR
        if: github.event_name == 'push' && github.ref == 'refs/heads/main'
        uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}
      - name: Extract image metadata
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: ghcr.io/ezio927/unimove-${{ matrix.component }}
          tags: |
            type=sha,format=long
            type=raw,value=latest,enable={{is_default_branch}}
      - uses: docker/build-push-action@v6
        with:
          context: ./${{ matrix.component }}
          push: ${{ github.event_name == 'push' && github.ref == 'refs/heads/main' }}
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
```

Add a short README distribution subsection with the two image names, anonymous pull commands, SHA-tag recommendation, and the statement that package visibility must be changed to Public after the first publish.

- [ ] **Step 3: Run GREEN and workflow checks**

Run: `npm run test:deployment`  
Expected: 3 tests PASS.

Run: `npm run verify`  
Expected: lint, type-check, all tests, and both builds PASS.

Run: `git diff --check`  
Expected: exit 0.

- [ ] **Step 4: Request scoped review and commit**

Reviewer verifies forked pull requests cannot publish, PRs still build both images, only the Docker job receives `packages: write`, tags are immutable, and README does not claim packages already exist.

```bash
git add scripts/deployment-contract.test.mjs .github/workflows/ci.yml README.md
git commit -m "ci: publish UniMove images to GHCR"
```

---

### Task 3: Configuration PR and `main` publication gate

**Files:**
- Modify after actual review only: `AGENT_LOG.md`
- Modify after actual review only: `SPEC_PROCESS.md`
- Modify after actual review only: `PLAN.md`

**Interfaces:**
- Consumes: Tasks 1–2 commits and their actual TDD/review evidence.
- Produces: a merged configuration PR, green GitHub CI, and two GHCR packages created from `main`.

- [ ] **Step 1: Record only actual process evidence**

Add concise entries naming the implementation and reviewer Agents, actual model/effort, actual RED/GREEN commands, commits, findings, fixes, human approvals, and remaining external deployment gate. Mark P10 pending; do not claim Render, Atlas, GHCR visibility, or NJU GitLab success yet.

- [ ] **Step 2: Run pre-PR verification**

Run: `npm run verify`  
Run: both Compose config commands with process-local dummy values and suppressed rendered output.  
Run: `git diff --check` and a credential scan for URI userinfo, private keys, Render/Atlas tokens, and non-example `.env` files.  
Expected: all exit 0 and no credential finding.

- [ ] **Step 3: Obtain whole-branch review**

Review the diff from merge base through HEAD against the approved design and this plan. Fix all Critical/Important findings with the relevant TDD cycle, then obtain one scoped re-review. Commit truthful evidence changes only after the review exists.

```bash
git add AGENT_LOG.md SPEC_PROCESS.md PLAN.md
git commit -m "docs: record deployment configuration evidence"
```

- [ ] **Step 4: Push, create the configuration PR, and wait for CI**

Use `superpowers:finishing-a-development-branch`. Recommend the PR option; do not merge without student approval. The PR description must state that Render/Atlas provisioning and exact URL evidence remain pending.

- [ ] **Step 5: After student approval, merge and verify publication**

Wait for Frontend, Backend, both Docker matrix jobs, and Dependency Review to pass. Merge, then verify the `main` workflow published both packages. In GitHub package settings, the student changes each package visibility to Public. Verify anonymous package pages or pulls before calling distribution complete.

---

### Task 4: Atlas and Render provisioning

**Files:**
- No repository file changes until real URLs and checks exist.

**Interfaces:**
- Consumes: merged `render.yaml`, public GitHub repository, and student-owned Render/Atlas accounts.
- Produces: `RENDER_FRONTEND_URL`, `RENDER_API_URL`, an Atlas `unimove` database, and public runtime evidence.

- [ ] **Step 1: Student creates Atlas resources without sharing secrets**

Create project `unimove-course`, one Free Cluster in a region compatible with the Render Singapore backend, and application user `unimove_app` with read/write permission only for database `unimove`. Generate a strong password in Atlas and keep it out of chat. Copy the `mongodb+srv` application URI directly into Render when prompted.

- [ ] **Step 2: Student authorizes Render and creates the Blueprint**

Connect Render to `Ezio927/UniMove`, select the root `render.yaml`, and provide only in the Render dashboard:

- `MONGODB_URI`: Atlas application URI.
- `FRONTEND_URL`: the exact HTTPS URL assigned to `unimove-ezio927-web`.
- `VITE_API_URL`: the exact HTTPS URL assigned to `unimove-ezio927-api`, with `/api` appended.

Do not paste these values into chat or commit them. Allow Render to generate `JWT_SECRET`.

- [ ] **Step 3: Restrict Atlas to Render outbound addresses**

The first backend deploy may fail before Atlas allows Render. From the Render service Connect page, copy its published outbound CIDRs into the Atlas IP access list, then redeploy. Do not use a permanent `0.0.0.0/0` entry. Record only the fact and count of ranges, not the database URI.

- [ ] **Step 4: Verify backend and frontend runtime**

Run from a clean client:

```bash
curl -fsS "$RENDER_API_URL/api/health"
curl -fsSI "$RENDER_FRONTEND_URL"
curl -fsSI "$RENDER_FRONTEND_URL/activities"
```

Expected: health is HTTP 200 with `success: true` and `database: connected`; frontend and deep SPA route are HTTP 200 over HTTPS.

- [ ] **Step 5: Initialize sanitized demonstration data**

The student registers a private account through the WebUI, changes only that account's `role` to `admin` in Atlas, and creates two or three non-sensitive activities through the WebUI. Do not publish the admin password. Use a separate ordinary account to verify registration, login, activity browse, order, comment, and favorite flows.

- [ ] **Step 6: Record a manual smoke checklist**

Record pass/fail and timestamp for registration, login, activity creation, browse, order, comment, favorite, profile, frontend deep-link refresh, backend cold wake, and health recovery. A failed item blocks P10 completion until diagnosed with `superpowers:systematic-debugging`.

---

### Task 5: Minimal deployment evidence and final course gate

**Files:**
- Modify: `README.md`
- Modify: `PLAN.md`
- Modify: `AGENT_LOG.md`
- Modify: `SPEC_PROCESS.md`
- Student creates: `REFLECTION.md`

**Interfaces:**
- Consumes: exact Render URLs, public GHCR package pages, green GitHub workflow, runtime smoke record, and NJU GitLab pipeline.
- Produces: truthful P10 completion evidence and the remaining student-owned P11 reflection deliverable.

- [ ] **Step 1: Create a small evidence branch from updated `main`**

Use `superpowers:using-git-worktrees`. Do not reuse or rewrite the merged configuration branch. Add exact, observed URLs only; no example or guessed URL is allowed.

- [ ] **Step 2: Update the minimum required documentation**

README receives the live WebUI URL, API health URL, two public GHCR package URLs and pull commands, the three-service deployment diagram, CI/CD flow, secret placement, free-tier cold-start limit, and Atlas/Render responsibility boundary.

Mark P10 complete in `PLAN.md` only if every Task 4 runtime check passed. Add concise Agent/process entries with actual prompts summarized, commits, review verdicts, human secret-entry boundary, and validation timestamps. Keep P11 pending until the student reflection exists.

- [ ] **Step 3: Student authors reflection; Agent only polishes**

The student supplies the substantive lessons, decisions, failures, Agent comparison, and personal assessment. The Agent may organize and polish this into 1500–2500 Chinese characters without inventing experiences or claiming authorship.

- [ ] **Step 4: Obtain the required NJU GitLab pass record**

Mirror or push the final branch to the designated NJU Git repository, run `.gitlab-ci.yml`, and verify the latest pipeline has a passing job named exactly `unit-test`. Record the pipeline URL or screenshot location without embedding credentials.

- [ ] **Step 5: Run final verification and independent review**

Run fresh:

```bash
npm run verify
docker build -t unimove-backend:submission ./backend
docker build -t unimove-frontend:submission ./frontend
git diff --check
```

Re-run public URL, anonymous GHCR visibility, and credential scans. Request whole-branch review; fix Critical/Important findings and obtain scoped approval.

- [ ] **Step 6: Commit and finish the evidence branch**

```bash
git add README.md PLAN.md AGENT_LOG.md SPEC_PROCESS.md REFLECTION.md
git commit -m "docs: record public deployment evidence"
```

Use `superpowers:finishing-a-development-branch`, recommend a PR, wait for CI, and merge only after student approval. The assignment is complete only when the public WebUI still responds, both registries are public, the latest GitHub and NJU GitLab pipelines pass, and the student-authored reflection is present.
