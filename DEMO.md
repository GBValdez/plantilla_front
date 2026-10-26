# Probar la demo local

Desde la raíz de este repositorio:

```powershell
npm ci
npm run demo
```

También puedes usar `.\Iniciar.ps1 -Servicio Demo`.

Abre `http://127.0.0.1:4200/login`.

| Cuenta | Correo | Contraseña |
| --- | --- | --- |
| Administrador | admin@demo.local | Demo2026! |
| Miembro | usuario@demo.local | Demo2026! |

Puedes iniciar sesión, recorrer el panel, buscar y paginar usuarios, editar sus estados y permisos y comprobar el acceso de un miembro. La demo incluye 26 cuentas ficticias. Todas las contraseñas de demostración son `Demo2026!`; las cuentas desactivadas no pueden acceder.

Acerca el mouse al menú lateral para expandirlo y abre «Administrador → Usuarios». Haz clic en una tarjeta de usuario y selecciona «Editar». Los roles se buscan en «Buscar Rol», se añaden como etiquetas y se pueden quitar o limpiar; «Guardar cambios» solicita confirmación. En pantallas táctiles utiliza el botón del menú.

Los cambios viven en la memoria del servicio local y se restablecen al reiniciarlo. Las sesiones de demo se guardan con un prefijo distinto al de las sesiones normales. El administrador principal conserva sus permisos para evitar bloquear la prueba.

No utiliza PostgreSQL, no accede a tu API .NET y no envía correos. El registro y la recuperación por correo muestran un mensaje explicando que no están habilitados en esta demo. No introduzcas credenciales reales.

El servicio simulado escucha únicamente en `127.0.0.1:5380`; Angular utiliza la configuración explícita `demo`. `npm start` y la compilación de producción mantienen la conexión y la autenticación normales. La demo se identifica visualmente en todas sus pantallas.

Para comprobarla:

```powershell
npm run test:demo-api
npm run test:demo-ui
```

Las pruebas de navegador usan otro par de puertos, 4312 y 5382, y realizan llamadas reales al servicio simulado, sin interceptar las respuestas HTTP.
