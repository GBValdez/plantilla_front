# Pedidos · Plantilla Angular

Angular 22.2.3, CLI/Material 22.2.4 y TypeScript 6. Inter e iconos locales. Conserva menú por hover, transiciones, tarjetas con menú, búsqueda de roles con etiquetas y confirmaciones originales.

## Probar la demo

Necesitas Node compatible con Angular: ^22.22.3, ^24.15.0 o 26+.

```powershell
npm ci
npm run demo
```

Abre http://127.0.0.1:4200/login. Administrador: **admin@demo.local / Demo2026!**. Miembro: **usuario@demo.local / Demo2026!**. Son datos ficticios exclusivos de la demo local, sin PostgreSQL ni SMTP. [Funciones y límites](DEMO.md).

## Usar la API real

Configura y arranca el repositorio [.NET](https://github.com/GBValdez/plantilla_Net). Después:

```powershell
npm ci
npm start
```

El proxy envía `/api` a http://localhost:5279 eliminando el prefijo. La cuenta real se configura al inicializar la API; las credenciales demo no dan acceso a la API real. En producción configura tu servidor web para reenviar `/api` y servir `index.html` al abrir rutas de Angular.

## Verificar

```powershell
npm run check:components
npm run build
npm test
npm run test:e2e
npm run test:demo-api
npm run test:demo-ui
```

También puedes usar `.\Verificar.ps1`. Playwright utiliza Edge en Windows y puertos de prueba separados. En otras plataformas adapta `channel` e instala el navegador correspondiente.

`check:components` compila todos los componentes, incluso los que no tienen ruta. Las suites activas están en `src/app/core-tests`, `e2e`, `demo-tests` y `tools/demo-api.test.mjs`. Los tests generados heredados se conservan como referencia fuera de la suite activa.

## Diseño y componentes

- [Actualización visual y capturas](DISENO-INTERFAZ.md).
- [Comparación con las mecánicas originales](REVISION-COMPONENTES.md).
- `src/app/utils` contiene CMS, formularios, catálogos, autocompletados y otras utilidades reutilizables.

Se conserva el adaptador global Moment con formato DD/MM/YYYY. El build genera un aviso informativo de tamaño inicial cercano a 563 kB frente al presupuesto de 500 kB; el límite de error sigue en 1 MB. Los enlaces de ejemplo a módulos de negocio del original siguen pendientes de implementación.

La demo usa un prefijo de almacenamiento distinto al normal. El JWT real tiene caducidad y sólo se envía a la API; la autorización efectiva se valida en el servidor. No guardes credenciales reales en los archivos del repositorio.
