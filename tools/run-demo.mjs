import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { once } from 'node:events';
import { createDemoServer, DEMO_ADMIN_EMAIL, DEMO_PASSWORD } from './demo-api.mjs';

const args = process.argv.slice(2);
const option = (name, fallback) => Number(args[args.indexOf(name) + 1] ?? fallback);
const port = args.includes('--port') ? option('--port', 4200) : 4200;
const apiPort = args.includes('--api-port') ? option('--api-port', 5380) : 5380;
const front = fileURLToPath(new URL('../', import.meta.url));
const api = createDemoServer();
api.listen(apiPort, '127.0.0.1');
await once(api, 'listening');
console.log('DEMO LOCAL: datos ficticios; cambios temporales; no se envían correos.');
console.log('Acceso: ' + DEMO_ADMIN_EMAIL + ' / ' + DEMO_PASSWORD);
console.log('URL: http://127.0.0.1:' + port + '/login');
const angular = spawn(process.execPath, ['node_modules/@angular/cli/bin/ng.js', 'serve', '--configuration', 'demo', '--host', '127.0.0.1', '--port', String(port)], {
  cwd: front, stdio: 'inherit', windowsHide: true,
  env: { ...process.env, DEMO_API_PORT: String(apiPort), NG_BUILD_MAX_WORKERS: process.env.NG_BUILD_MAX_WORKERS ?? '2' },
});
const shutdown = () => { angular.kill(); api.closeAllConnections(); api.close(); };
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
angular.on('error', error => { console.error(error.message); shutdown(); process.exitCode = 1; });
angular.on('exit', code => { api.closeAllConnections(); api.close(); process.exitCode = code ?? 0; });
