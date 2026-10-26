import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createDemoServer } from './demo-api.mjs';

let server;
let base;
before(async () => {
  server = createDemoServer();
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  base = 'http://127.0.0.1:' + server.address().port;
});
after(async () => {
  server.closeAllConnections();
  await new Promise(resolve => server.close(resolve));
});
async function request(path, options = {}) {
  return fetch(base + path, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options.headers },
  });
}
async function login(email = 'admin@demo.local', password = 'Demo2026!') {
  const response = await request('/user/login', { method: 'POST', body: JSON.stringify({ email, password }) });
  assert.equal(response.status, 200);
  return (await response.json()).token;
}

test('demo identifies itself as fictitious data', async () => {
  const response = await request('/health');
  assert.equal(response.status, 200);
  assert.equal((await response.json()).demo, true);
});
test('demo credentials grant an administrator session with the claims used by Angular', async () => {
  const token = await login();
  const claims = JSON.parse(Buffer.from(token.split('.')[1], 'base64url'));
  assert.equal(claims.demo, true);
  assert.equal(claims.email, 'admin@demo.local');
  assert.equal(claims['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'], 'ADMINISTRATOR');
});
test('wrong passwords and anonymous administrative requests are rejected', async () => {
  assert.equal((await request('/user/login', { method: 'POST', body: JSON.stringify({email:'admin@demo.local',password:'wrong'}) })).status, 400);
  assert.equal((await request('/user')).status, 401);
});
test('administrator can filter and paginate the fictitious users', async () => {
  const token = await login();
  const headers = { Authorization: 'Bearer ' + token };
  const page = await (await request('/user?pageNumber=2&pageSize=5', { headers })).json();
  assert.equal(page.index, 2);
  assert.equal(page.items.length, 5);
  const filtered = await (await request('/user?UserNameCont=ana&pageNumber=1&pageSize=10', { headers })).json();
  assert.equal(filtered.total, 1);
  assert.equal(filtered.items[0].userName, 'ana');
});
test('member accounts cannot administer users', async () => {
  const token = await login('usuario@demo.local');
  const response = await request('/user', { headers: { Authorization: 'Bearer ' + token } });
  assert.equal(response.status, 403);
});
test('editing a user updates demo state and rejects unknown roles', async () => {
  const token = await login();
  const headers = { Authorization: 'Bearer ' + token };
  const changed = await request('/user/ana', { method: 'PUT', headers, body: JSON.stringify({status:false,roles:['userNormal']}) });
  assert.equal(changed.status, 204);
  const user = await (await request('/user/ana', { headers })).json();
  assert.equal(user.isActive, false);
  assert.deepEqual(user.roles, ['userNormal']);
  assert.equal((await request('/user/ana', {method:'PUT',headers,body:JSON.stringify({status:true,roles:['unknown']})})).status, 400);
});
test('demo protects its administrator account from accidental lockout', async () => {
  const token = await login();
  assert.equal((await request('/user/admin', {method:'PUT',headers:{Authorization:'Bearer '+token},body:JSON.stringify({status:false,roles:[]})})).status, 400);
});
