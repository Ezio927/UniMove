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
