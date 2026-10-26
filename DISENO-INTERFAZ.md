# Diseño de la interfaz

Actualización visual del 26 de octubre de 2026.

La interfaz utiliza verde bosque, acentos lima suaves, fondos claros, tarjetas blancas y tipografía Inter local. Los colores, contornos, botones, selectores, menús y diálogos comparten tokens de Angular Material.

## Qué se mejoró

- Acceso con panel de bienvenida, formulario sobre tarjeta, iconos y credenciales demo más claras.
- Menú lateral con mejor contraste, selección, separación, profundidad e iconografía.
- Usuarios con tarjetas ordenadas, avatares, estados, filtros y paginación coherentes.
- Edición de usuario con tarjetas de información y roles en columnas que se apilan en móvil.
- Registro, recuperación, cambio de contraseña y confirmaciones con espaciado y botones uniformes.
- CMS, catálogos y sus formularios con tarjetas y distribuciones adaptables.
- Listas, etiquetas, autocompletados, ubicación y rangos horarios con el mismo lenguaje visual.
- Dashboard con ilustración vectorial decorativa en CSS. No añade datos ni controles.

## Mecánicas conservadas

Se modificaron exclusivamente estilos CSS/SCSS. Se verificaron los **115 archivos TypeScript y HTML** contra el estado anterior: los archivos TypeScript y los bindings, eventos, controles, referencias y condiciones de las plantillas permanecen iguales. Las plantillas HTML tampoco se editaron.

Se mantienen la apertura del menú por hover, sus anchuras 60/300 px, la transición de 200 ms, el retraso de etiquetas de 150 ms y su aparición de 500 ms. Se conservan el botón táctil, las tarjetas con menú de acciones, el buscador de roles, las etiquetas y todas las confirmaciones.

## Comprobaciones

| Comprobación | Resultado |
| --- | --- |
| Compilación de todos los componentes | Correcta, incluidos los reutilizables sin ruta |
| Pruebas unitarias existentes | 38 aprobadas |
| Navegador normal | 14 aprobadas |
| Navegador demo | 7 aprobadas |
| Diseño adaptable | Sin desbordamiento a 320, 375, 768, 1024 y 1440 px; también en horizontal a 812 × 375 |
| Movimiento reducido | Comprobado; se respeta la preferencia del navegador |
| Errores JavaScript en las capturas | Ninguno |
| Compilación de producción | Correcta; 563.05 kB iniciales, con el aviso informativo de 500 kB ya documentado |

Se analizaron con axe acceso, registro, recuperación, dashboard, usuarios, roles y confirmación. No se encontraron incidencias de contraste en esas pantallas. En las tarjetas de usuarios permanece el aviso heredado `label-content-name-mismatch`: el nombre accesible existente dice «Opciones de…» mientras la tarjeta contiene también correo y estado. No se cambiaron las etiquetas de acciones en esta actualización exclusivamente visual.

La revisión independiente de estilos y capturas no encontró regresiones nuevas confirmadas. Los componentes CMS y catálogos sin rutas configuradas conservan sus pruebas de contratos y compilación; no se añadieron pantallas al producto para probarlos.

## Capturas

- [Acceso, escritorio](previews/diseno-login-1440.png)
- [Acceso, móvil](previews/diseno-login-375.png)
- [Dashboard y menú](previews/diseno-dashboard-1440.png)
- [Usuarios](previews/diseno-usuarios-1440.png)
- [Usuarios, móvil](previews/diseno-usuarios-375.png)
- [Roles](previews/diseno-roles-1440.png)
- [Roles, móvil](previews/diseno-roles-375.png)
- [Registro](previews/diseno-registro-1440.png)
- [Registro, móvil](previews/diseno-registro-375.png)
- [Recuperación](previews/diseno-recuperacion-1440.png)
- [Confirmación](previews/diseno-confirmacion-1440.png)
