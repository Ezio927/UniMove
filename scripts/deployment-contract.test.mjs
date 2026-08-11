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

test('GitHub CI publishes both images only after quality gates with scoped package permission', () => {
  const workflow = read('.github/workflows/ci.yml');
  const start = workflow.indexOf('  docker-build:');
  const end = workflow.indexOf('\n  dependency-review:', start);
  assert.notEqual(start, -1, 'docker-build job is required');
  assert.notEqual(end, -1, 'docker-build block must end before dependency-review');
  const dockerBuild = workflow.slice(start, end);
  const loginStart = dockerBuild.indexOf('      - name: Log in to GHCR');
  const loginEnd = dockerBuild.indexOf('\n      - name: Extract image metadata', loginStart);
  assert.notEqual(loginStart, -1, 'GHCR login step is required');
  assert.notEqual(loginEnd, -1, 'GHCR login step must precede metadata extraction');
  const loginStep = dockerBuild.slice(loginStart, loginEnd);

  assert.match(workflow, /^permissions:\r?\n  contents: read\r?$/m);
  assert.match(dockerBuild, /^    needs: \[frontend, backend\]$/m);
  assert.match(dockerBuild, /^    permissions:\r?\n      contents: read\r?\n      packages: write\r?$/m);
  assert.match(dockerBuild, /component: \[backend, frontend\]/);
  assert.match(dockerBuild, /ghcr\.io\/ezio927\/unimove-\$\{\{ matrix\.component \}\}/);
  assert.match(loginStep, /^        uses: docker\/login-action@v3$/m);
  assert.match(loginStep, /^        if: github\.event_name == 'push' && github\.ref == 'refs\/heads\/main'$/m);
  assert.match(dockerBuild, /push: \$\{\{ github\.event_name == 'push' && github\.ref == 'refs\/heads\/main' \}\}/);
  assert.match(dockerBuild, /type=sha,format=long,prefix=/);
  assert.match(dockerBuild, /type=raw,value=latest,enable=\{\{is_default_branch\}\}/);
});
