import { createServer } from 'node:http';
import { createHmac, randomBytes } from 'node:crypto';

export const DEMO_PASSWORD = 'Demo2026!';
export const DEMO_ADMIN_EMAIL = 'admin@demo.local';
const roleClaim = 'http://schemas.microsoft.com/ws/2008/06/identity/claims/role';
const nameClaim = 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name';
const roles = [
  { id: 'demo-admin', name: 'ADMINISTRATOR', description: 'Administración de la demo' },
  { id: 'demo-member', name: 'userNormal', description: 'Miembro de demostración' },
];

function initialUsers() {
  return [
    { userName: 'admin', email: DEMO_ADMIN_EMAIL, isActive: true, roles: ['ADMINISTRATOR'] },
    { userName: 'usuario', email: 'usuario@demo.local', isActive: true, roles: ['userNormal'] },
    ...['ana', 'diego', 'maria', 'carlos', 'sofia', 'pablo', 'elena', 'luis', 'lucia', 'jorge', 'andrea', 'daniel', 'valeria', 'pedro', 'camila', 'mateo', 'laura', 'oscar', 'paula', 'roberto', 'ines', 'sergio', 'clara', 'nicolas'].map((name, index) => ({
      userName: name, email: name + '@example.test', isActive: index % 5 !== 1, roles: ['userNormal'],
    })),
  ];
}

async function readJson(request) {
  const chunks = [];
  let length = 0;
  for await (const chunk of request) {
    length += chunk.length;
    if (length > 16384) throw new Error('request too large');
    chunks.push(chunk);
  }
  return JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}');
}

/** Local demonstration service only: no database, SMTP, or production credentials. */
export function createDemoServer() {
  const users = initialUsers();
  const sessions = new Map();
  const signingKey = randomBytes(32);
  const issue = user => {
    const now = Math.floor(Date.now() / 1000);
    const claims = {
      sub: user.userName, email: user.email, [nameClaim]: user.userName,
      [roleClaim]: user.roles.length === 1 ? user.roles[0] : user.roles,
      iat: now, exp: now + 1800, demo: true, iss: 'PanelBase.LocalDemo',
      jti: randomBytes(16).toString('hex'),
    };
    const body = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url') + '.' + Buffer.from(JSON.stringify(claims)).toString('base64url');
    const token = body + '.' + createHmac('sha256', signingKey).update(body).digest('base64url');
    for (const [key, value] of sessions) if (value.expires <= Date.now()) sessions.delete(key);
    sessions.set(token, { name: user.userName, expires: claims.exp * 1000 });
    return { token, expiration: new Date(claims.exp * 1000).toISOString() };
  };

  return createServer(async (request, response) => {
    const send = (status, body) => {
      response.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
      response.end(status === 204 ? undefined : JSON.stringify(body));
    };
    const error = (status, message) => send(status, { message });
    try {
      const url = new URL(request.url, 'http://127.0.0.1');
      const route = url.pathname;
      if (route === '/health' && request.method === 'GET') return send(200, { status: 'ok', demo: true });
      if (route === '/user/login' && request.method === 'POST') {
        const data = await readJson(request);
        const user = users.find(user => user.email.toLowerCase() === String(data.email ?? '').trim().toLowerCase());
        if (!user?.isActive || data.password !== DEMO_PASSWORD) return error(400, 'Credenciales de demo incorrectas. Usa admin@demo.local y Demo2026!.');
        return send(200, issue(user));
      }
      if (['/user/register', '/user/forgotPassword', '/user/resetPassword', '/user/confirmEmail'].includes(route)) {
        return error(400, 'La demo no envía correos ni crea cuentas reales. Para probar el panel usa admin@demo.local y Demo2026!.');
      }

      const token = request.headers.authorization?.replace(/^Bearer /, '');
      const session = sessions.get(token);
      const actor = session && session.expires > Date.now() ? users.find(user => user.userName === session.name && user.isActive) : null;
      if (!actor) return error(401, 'Inicia sesión con una cuenta de demostración.');
      if (!actor.roles.includes('ADMINISTRATOR')) return error(403, 'Esta cuenta de demostración no tiene permisos de administración.');

      if (route === '/rol' && request.method === 'GET') return send(200, { items: roles, total: roles.length, index: 1, totalPages: 1 });
      if (route === '/user' && request.method === 'GET') {
        const pageNumber = Number(url.searchParams.get('pageNumber') ?? 1);
        const pageSize = Number(url.searchParams.get('pageSize') ?? 10);
        if (!Number.isInteger(pageNumber) || pageNumber < 1 || !Number.isInteger(pageSize) || pageSize < 1 || pageSize > 100) return error(400, 'Paginación inválida.');
        const name = (url.searchParams.get('UserNameCont') ?? '').toLowerCase();
        const email = (url.searchParams.get('EmailCont') ?? '').toLowerCase();
        const state = url.searchParams.get('isActive');
        const wantedRoles = (url.searchParams.get('roles') ?? '').split(',').filter(Boolean).map(id => roles.find(role => role.id === id)?.name ?? id);
        const filtered = users.filter(user => user.userName.toLowerCase().includes(name) && user.email.toLowerCase().includes(email) &&
          (state === null || state === '' || user.isActive === (state === 'true')) &&
          (!wantedRoles.length || wantedRoles.some(role => user.roles.includes(role))));
        const total = filtered.length;
        return send(200, { items: filtered.slice((pageNumber - 1) * pageSize, pageNumber * pageSize), total, index: pageNumber, totalPages: Math.ceil(total / pageSize) });
      }
      if (route.startsWith('/user/')) {
        const userName = decodeURIComponent(route.slice('/user/'.length));
        const user = users.find(user => user.userName === userName);
        if (!user) return error(404, 'No existe ese usuario de demostración.');
        if (request.method === 'GET') return send(200, user);
        if (request.method === 'PUT') {
          const data = await readJson(request);
          if (typeof data.status !== 'boolean' || !Array.isArray(data.roles) || !data.roles.length || data.roles.some(name => !roles.some(role => role.name === name))) return error(400, 'Selecciona un estado y al menos un rol válido.');
          if (user.userName === 'admin' && (!data.status || !data.roles.includes('ADMINISTRATOR'))) return error(400, 'Conserva activa la cuenta administradora para poder seguir probando.');
          user.isActive = data.status;
          user.roles = [...new Set(data.roles)];
          for (const [key, value] of sessions) if (value.name === user.userName) sessions.delete(key);
          return send(204);
        }
      }
      return error(404, 'Esa operación no forma parte de la demo local.');
    } catch {
      if (!response.headersSent) error(400, 'La solicitud de demostración no es válida.');
    }
  });
}
