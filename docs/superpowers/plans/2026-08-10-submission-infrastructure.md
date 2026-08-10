# Submission Infrastructure Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make UniMove verifiable and distributable from the repository root with one-command quality gates, required GitLab CI, continuously built Docker images, and submission-ready documentation.

**Architecture:** A dependency-free root npm package delegates to the existing frontend and backend packages. GitHub and GitLab CI call the same scripts. Docker Compose runs only the three core services, while Mongo Express moves to an explicit tools override so optional administration does not block normal startup.

**Tech Stack:** npm/Node.js 22, GitHub Actions, GitLab CI, Docker/Compose, MongoDB 7, nginx.

## Global Constraints

- Do not add npm runtime or development dependencies.
- Do not change business behavior, API contracts, enrollment, orders, comments, or favorites.
- All commands must work from Windows PowerShell and Linux CI without Unix-only shell syntax in npm scripts.
- Keep all credentials in environment variables; never commit real secrets.
- `unit-test` must be the exact GitLab CI job name.
- Do not claim a registry image or online deployment until it exists and has been verified.

---

## File Map

- `package.json`, `package-lock.json`: dependency-free root command contract.
- `.gitlab-ci.yml`: course-required test and quality jobs.
- `.github/workflows/ci.yml`: existing checks plus Dockerfile build verification.
- `frontend/Dockerfile`: build-time API URL and nginx runtime configuration.
- `frontend/nginx.conf`: SPA fallback, same-origin API proxy, health endpoint.
- `backend/Dockerfile`: backend runtime healthcheck.
- `docker-compose.yml`: core MongoDB/backend/frontend stack with health dependencies.
- `docker-compose.tools.yml`: optional authenticated Mongo Express service.
- `README.md`, `DOCKER_GUIDE.md`: commands, distribution, security boundary, limitations.
- `PLAN.md`, `AGENT_LOG.md`, `SPEC_PROCESS.md`: accurate course-process evidence.

### Task 1: Root quality command contract

**Files:**
- Create: `package.json`
- Create: `package-lock.json`
- Modify: `README.md`

**Interfaces:**
- Produces: `npm test`, `npm run lint`, `npm run type-check`, `npm run build`, `npm run verify` from repository root.
- Consumes: unchanged scripts in `backend/package.json` and `frontend/package.json`.

- [ ] **Step 1: Create the dependency-free root package manifest**

Use exact sequential scripts:

```json
{
  "name": "unimove",
  "version": "1.0.0",
  "private": true,
  "engines": { "node": ">=22.12.0" },
  "scripts": {
    "install:all": "npm ci --prefix backend && npm ci --prefix frontend",
    "test:backend": "npm test --prefix backend",
    "test:frontend": "npm test --prefix frontend",
    "test": "npm run test:backend && npm run test:frontend",
    "lint": "npm run lint --prefix backend && npm run lint --prefix frontend",
    "type-check": "npm run type-check --prefix backend && npm run type-check --prefix frontend",
    "build": "npm run build --prefix backend && npm run build --prefix frontend",
    "verify": "npm run lint && npm run type-check && npm test && npm run build"
  }
}
```

- [ ] **Step 2: Generate and inspect the root lock file**

Run `npm install --package-lock-only --ignore-scripts` from the root. Verify that `package-lock.json` contains no dependencies and records the Node engine.

- [ ] **Step 3: Prove the one-command contract**

Run:

```text
npm test
npm run verify
```

Expected: backend and frontend test counts appear, followed by successful lint, type-check and builds.

- [ ] **Step 4: Document root commands**

Update README “常用命令” so `npm test` is the primary course test command and `npm run verify` is the complete local/CI gate. Retain subproject commands only as troubleshooting detail.

- [ ] **Step 5: Commit**

```text
git add package.json package-lock.json README.md
git commit -m "build: add root quality commands"
```

### Task 2: GitLab and GitHub CI

**Files:**
- Create: `.gitlab-ci.yml`
- Modify: `.github/workflows/ci.yml`

**Interfaces:**
- Consumes: Task 1 `npm test` and `npm run verify` commands.
- Produces: exact GitLab `unit-test` job and GitHub `docker-build` job.

- [ ] **Step 1: Add GitLab CI**

Create two jobs using `node:22-bookworm-slim` and an npm cache under `.npm/`:

```yaml
stages:
  - test
  - quality

default:
  image: node:22-bookworm-slim
  cache:
    key:
      files:
        - backend/package-lock.json
        - frontend/package-lock.json
    paths:
      - .npm/
  before_script:
    - npm ci --prefix backend --cache .npm --prefer-offline
    - npm ci --prefix frontend --cache .npm --prefer-offline

unit-test:
  stage: test
  script:
    - npm test

quality:
  stage: quality
  script:
    - npm run lint
    - npm run type-check
    - npm run build
```

- [ ] **Step 2: Add GitHub Docker build verification**

Add a `docker-build` job to `.github/workflows/ci.yml` that checks out the repository, sets up Buildx, then uses `docker/build-push-action@v6` twice with `push: false` for `./backend` and `./frontend`. Do not add registry authentication.

- [ ] **Step 3: Validate the CI definitions**

Use a YAML parser already available in the environment when possible. Independently inspect that `.gitlab-ci.yml` has top-level `unit-test`, that both lock files are installed, and that the GitHub jobs use existing Dockerfile contexts. Run `git diff --check`.

- [ ] **Step 4: Commit**

```text
git add .gitlab-ci.yml .github/workflows/ci.yml
git commit -m "ci: add course and container checks"
```

### Task 3: Reliable Docker distribution

**Files:**
- Modify: `frontend/Dockerfile`
- Modify: `frontend/nginx.conf`
- Modify: `backend/Dockerfile`
- Modify: `docker-compose.yml`
- Create: `docker-compose.tools.yml`

**Interfaces:**
- Produces: frontend at `http://localhost`, same-origin `/api` proxy, backend health at `/api/health`, optional Mongo Express profile through an override file.

- [ ] **Step 1: Fix the frontend image contract**

In the build stage declare:

```dockerfile
ARG VITE_API_URL=/api
ENV VITE_API_URL=$VITE_API_URL
```

Copy `nginx.conf` to `/etc/nginx/nginx.conf` in the runtime stage and add a healthcheck against `http://localhost/health`.

- [ ] **Step 2: Add the nginx health endpoint**

Inside the existing server block add an exact `/health` location returning status 200 and plain text. Preserve SPA fallback and `/api` proxy to `http://backend:3001`.

- [ ] **Step 3: Add backend image healthcheck**

Use Node 22 built-in `fetch` in `HEALTHCHECK` to request `http://localhost:3001/api/health` and exit nonzero unless the response is OK. Do not install curl/wget packages.

- [ ] **Step 4: Refactor the core Compose stack**

- Add MongoDB `mongosh --eval db.adminCommand('ping')` healthcheck.
- Add backend and frontend healthchecks consistent with their Dockerfiles.
- Change backend dependency to `mongodb: condition: service_healthy`.
- Change frontend dependency to `backend: condition: service_healthy`.
- Pass frontend build arg `VITE_API_URL: /api`; remove ineffective runtime `VITE_API_URL`.
- Keep required `MONGO_ROOT_PASSWORD` and `JWT_SECRET` interpolation.
- Remove Mongo Express from the core file.

- [ ] **Step 5: Add the optional tools override**

Create `docker-compose.tools.yml` containing only `mongo-express`, connected to the core `unimove-network`, with required `MONGO_ROOT_PASSWORD` and `MONGO_EXPRESS_PASSWORD`. Users start it with both files explicitly:

```text
docker compose -f docker-compose.yml -f docker-compose.tools.yml up --build
```

- [ ] **Step 6: Validate configuration and images**

Set non-secret disposable process-local values and run:

```text
docker compose config
docker compose -f docker-compose.yml -f docker-compose.tools.yml config
docker build backend
docker build frontend
```

If Docker Engine is available, start the core stack, wait for healthy services, request `/health` and `/api/health`, then stop it without deleting the named database volume. If Docker Engine is unavailable, record the exact failure and do not claim runtime verification.

- [ ] **Step 7: Commit**

```text
git add frontend/Dockerfile frontend/nginx.conf backend/Dockerfile docker-compose.yml docker-compose.tools.yml
git commit -m "build: harden Docker distribution"
```

### Task 4: Submission documentation and final evidence

**Files:**
- Modify: `README.md`
- Modify: `DOCKER_GUIDE.md`
- Modify: `PLAN.md`
- Modify: `AGENT_LOG.md`
- Modify: `SPEC_PROCESS.md`

**Interfaces:**
- Consumes: verified commands and CI/Docker behavior from Tasks 1–3.
- Produces: submission-facing documentation with no unverifiable claims.

- [ ] **Step 1: Rewrite Docker guidance to match reality**

Remove references to nonexistent `docker-manage.bat`, port 5173 inside Compose, development hot reload, destructive cleanup as a normal step, and obsolete `docker-compose` syntax. Document required environment variables, core startup, optional tools override, service URLs, logs, stop, rebuild and health inspection using `docker compose`.

- [ ] **Step 2: Complete README required sections**

Ensure explicit sections exist for project introduction, installation, running, one-command tests, distribution, directory structure, security boundary, known limitations, course process documents, and license/third-party technology attribution. Commands must match verified files.

- [ ] **Step 3: Update course process evidence**

Record this stage's actual Superpowers skills, Agent identities, prompt/context summaries, validation commands, review findings, human decisions and commits. Mark P8/P9 complete only after their commands pass. Leave P10 deployment and P11 reflection pending.

- [ ] **Step 4: Run final gates**

Run from the root:

```text
npm run verify
docker compose config
git diff --check
```

Also scan tracked files for common credential patterns and inspect the resulting diff. Record Docker runtime/build verification precisely.

- [ ] **Step 5: Request task and whole-branch reviews**

Review specification compliance first, then code/config quality, security boundaries, CI correctness and documentation accuracy. Fix all Critical/Important findings before integration.

- [ ] **Step 6: Commit evidence**

```text
git add README.md DOCKER_GUIDE.md PLAN.md AGENT_LOG.md SPEC_PROCESS.md
git commit -m "docs: complete submission infrastructure guide"
```
