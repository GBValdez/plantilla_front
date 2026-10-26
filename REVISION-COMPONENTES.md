# Revisión de mecánicas frente al original

Fecha: 26 de octubre de 2026.

Se compararon los **20 componentes, 4 directivas y 1 pipe** existentes en el frontend original. El inventario incluyó 94 archivos TypeScript, HTML y estilos. No se eliminó ninguno de esos archivos.

La referencia fue `la plantilla original Angular 18`. Las correcciones se hicieron en esta copia. Se compararon la lógica TypeScript y los enlaces de plantillas Angular, separando formato, estilos y `ChangeDetectionStrategy.Eager` de los cambios de comportamiento. Después se verificaron contratos de componentes y recorridos de navegador.

## Regresiones adicionales corregidas

- **Botones de formularios:** registro, recuperación y cambio de contraseña vuelven a estar deshabilitados cuando el formulario es inválido. Se conserva también el bloqueo durante el envío.
- **Fechas:** el adaptador Moment y el formato `DD/MM/YYYY` vuelven a estar disponibles globalmente, como en el original, para que otros formularios puedan reutilizarlos.
- **Carga de archivos:** se conserva `BtnUploadFileModule` como forma de importar la directiva. Ahora importa y reexporta la directiva standalone, de acuerdo con Angular 22.
- **Autocompletado:** vuelve a resolver un identificador numérico recibido como texto. Conserva el valor inicial hasta que llegan sus opciones; una respuesta tardía no sustituye el texto que el usuario ya empezó a escribir.
- **Edición de usuario:** la carga del usuario vuelve a ser independiente de la búsqueda de roles. Los roles se consultan al buscar; un fallo de esa consulta no descarta el usuario cargado ni sus permisos existentes.

La revisión también detectó dependencias **ya ausentes en el original** para exportación y tipos de Google Maps. Se declararon para permitir la compilación y reutilización de esas utilidades. Sus métodos, entradas y eventos se conservaron.

## Resultado por componente

| Componente | Mecánicas contrastadas y resultado |
| --- | --- |
| `AppComponent` | Router y carga global conservados. Aviso adicional sólo en la demo autorizada. |
| `HomeComponent` | Acceso, mostrar contraseña, registro y recuperación en diálogos, selector de imagen y navegación tras autenticar. Conservados. |
| `GeneralMenuComponent` | Jerarquía, permisos, contenido principal y confirmación de salida originales recuperados en la corrección anterior. |
| `SideMenuComponent` | Apertura por hover, cierre al salir, 60/300 px, transición de 200 ms y etiquetas diferidas. Conservados; botón adicional para uso táctil. |
| `SubLevelComponent` | Acordeón por nivel, hijos, rutas y acciones, incluidas entradas que combinan ruta e hijos. Conservados. |
| `DashboardComponent` | Original sin acciones. Conserva esa ausencia de flujos; sólo se muestra el título. |
| `UserHomeComponent` | Tarjetas que abren menú de acciones, edición, filtros y paginación. Conservados; siguen las correcciones de búsqueda vacía y filtros entre páginas. |
| `UserEditComponent` | Búsqueda de roles, etiquetas, quitar, limpiar, estado, cancelar y confirmar guardado. Recuperada además la carga independiente del usuario. |
| `UserCreateComponent` | Campos, validaciones, calendario, visibilidad de contraseña, confirmar y cancelar. Recuperado el bloqueo original del botón inválido. |
| `ForgotPasswordComponent` | Correo, validación, cancelar, enviar y cerrar el diálogo con aviso. Recuperado el bloqueo del botón inválido. |
| `ResetPasswordComponent` | Confirmación de contraseña, visibilidad, cancelar, confirmar y enviar. Recuperado el bloqueo del botón inválido. |
| `UserVerifyEmailComponent` | Token/correo por URL, solicitud y aviso conservados. La salida usa la ruta existente de acceso; un enlace incompleto no provoca una solicitud inválida. |
| `CataloguesHomeComponent` | Tarjetas con menú, crear, editar, borrar con confirmación, buscar, limpiar, paginar y submenús. Se conserva la restricción de editar/borrar roles. |
| `CatalogueFormComponent` | Crear/editar, dependencia, limpiar, cancelar, confirmar, callback `afterComplete` y cierre `{ modify: true }`. Lógica conservada. |
| `HomeCmsComponent` | Plantilla de tarjeta, acciones, paginación, borrado confirmado, navegación/callback y recarga sólo al modificar el diálogo. Lógica conservada. |
| `FormCmsComponent` | `map`, `mapEdit`, `finalizeEdit`, crear/editar, limpiar controles, confirmar y cerrar con `modify`. Lógica conservada. |
| `InputAutocompleteComponent` | Opciones, búsqueda, selección, escritura, salida de opción inexistente y CVA. Corregidas las regresiones de identificadores y opciones asíncronas. |
| `ListMakerListComponent` | Buscar, añadir, rechazar duplicados, quitar, limpiar y emitir identificadores. Conservado; cargar un valor desde el formulario no lo modifica mediante una emisión artificial. |
| `TimeRangeComponent` | Desde/hasta, validación del orden, valores vacíos, emisión y estado deshabilitado. Código funcional conservado. |
| `AutocompleteGoogleMapsComponent` | Input y evento `changeComplete` con la ubicación seleccionada. Código funcional conservado; tipos declarados. |

## Directivas, pipe y utilidades

| Elemento | Resultado |
| --- | --- |
| `BtnUploadFileDirective` | Se conservan selector, tipos, tamaño, cantidad, arrastrar/soltar, eventos y cambio de etiqueta. Los nombres se muestran como texto. |
| `OnlyNumberInputDirective` | Se conserva el filtrado numérico y la opción de decimales. |
| `OnlyNumberLetterInputDirective` | Se conserva el filtrado alfanumérico. |
| `DrErrorInputsDirective` | Se conserva la actualización de la vista según la validación del control. |
| `LocalTimezonePipe` | Se conserva la conversión UTC a zona local y el formato solicitado. |
| `ExportService` | Se conservan métodos, columnas, datos y nombres de Excel/PDF. Se verificaron archivos generados con las librerías reales, interceptando únicamente la descarga. |
| Servicios genéricos, catálogos y consultas | Lógica y contratos originales conservados. La codificación de nombres de usuario en URL evita interpretar sus caracteres como parte de la ruta. |
| Autenticación, guardas e interceptor | Se conservan las validaciones de seguridad de la actualización: caducidad, permisos, token sólo para la API y carga coordinada. No se restablecieron fallos de seguridad del original. |

## Verificación reproducible

Desde `front`:

```powershell
npm run check:components
npm test
npm run test:e2e
npm run test:demo-ui
npm run build
```

`check:components` comprueba **todos** los fuentes y sus plantillas, incluso los que no están conectados a una ruta actual. También se incorporó a `Verificar.ps1`.

Resultados de esta revisión: 38 pruebas unitarias, 14 pruebas de navegador normal y 7 de demo. La compilación completa de componentes y la de producción terminan correctamente. Al conservar el adaptador global de fechas, el arranque de producción queda en unos 558 kB; Angular avisa al superar el presupuesto informativo de 500 kB. El límite de error sigue en 1 MB y no se elevó para ocultar ese aviso.

## Alcance y límites

- CMS, catálogos y utilidades se verificaron con servicios/controladores de prueba y datos ficticios. No se añadieron módulos ni pantallas al producto para poder probarlos.
- Google Maps se comprobó con un sustituto de la API: input, selección y evento. No se cargó una cuenta, clave ni servicio real de Google Maps.
- No se utilizaron PostgreSQL ni SMTP reales; el backend no se modificó en esta revisión.
- Los enlaces de ejemplo a módulos de negocio que faltaban en el original siguen pendientes de implementación. Se conserva su jerarquía de navegación.
- Las dependencias de exportación son jsPDF 4.2.1, AutoTable 5.0.9 y SheetJS 0.20.3 desde su [distribución oficial](https://docs.sheetjs.com/docs/getting-started/installation/frameworks/). La instalación reportó cero vulnerabilidades en npm.

La comparación y estas pruebas no sustituyen una comprobación de cada integración con su infraestructura real; no se encontraron otras mecánicas eliminadas en los componentes revisados.
