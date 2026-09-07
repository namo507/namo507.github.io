// Browser-free regression tests for geometry and the audit HTTP server.
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, symlink, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { analyzeSymmetry } from './symmetry.mjs';
import { startServer } from './visual_audit.mjs';

const aligned = [
  { x:0,y:100,w:200,h:150 }, { x:220,y:100,w:200,h:150 }, { x:440,y:100,w:200,h:150 },
];
assert.equal(analyzeSymmetry(aligned).length, 0);
const issues = analyzeSymmetry([
  aligned[0], { x:220,y:118,w:200,h:120 }, { x:470,y:100,w:200,h:150 },
]);
for (const kind of ['row-top-misalign','row-height-mismatch','uneven-gaps']) {
  assert.ok(issues.some(issue => issue.kind === kind), kind);
}
const root = await mkdtemp(path.join(tmpdir(), 'site-doctor-'));
let server;
try {
  const site = path.join(root, 'site');
  await mkdir(path.join(site, 'cv'), { recursive:true });
  await writeFile(path.join(site, 'index.html'), '<h1>Home</h1>');
  await writeFile(path.join(site, 'cv/index.html'), '<h1>CV</h1>');
  await writeFile(path.join(site, '404.html'), '<h1>Missing</h1>');
  await writeFile(path.join(root, 'private.txt'), 'outside build');
  await symlink(path.join(root, 'private.txt'), path.join(site, 'escape.txt'));
  server = await startServer(site);
  const base = `http://127.0.0.1:${server.address().port}`;
  for (const route of ['/', '/cv/', '/cv', '/404']) {
    const response = await fetch(base + route);
    assert.equal(response.status, 200, route);
    assert.match(response.headers.get('content-type'), /text\/html/);
  }
  assert.equal((await fetch(base + '/missing/')).status, 404);
  assert.equal((await fetch(base + '/escape.txt')).status, 403);
  assert.equal((await fetch(base + '/%2e%2e%2fprivate.txt')).status, 403);
  assert.equal((await fetch(base + '/%ZZ')).status, 400);
  await assert.rejects(startServer(path.join(root, 'missing')));
  console.log('Passed geometry, route, missing build, traversal and symlink checks.');
} finally {
  if (server) await new Promise(resolve => server.close(resolve));
  await rm(root, { recursive:true, force:true });
}
