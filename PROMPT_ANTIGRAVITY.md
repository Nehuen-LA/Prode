# PROMPT PARA ANTIGRAVITY: PRODE LIGA - Web App de Pronósticos Deportivos

## 📌 RESUMEN EJECUTIVO (LEÉ ESTO PRIMERO)

**Qué tenés que hacer:**
- Implementar 22 puntos de mejora en una web app de pronósticos deportivos
- Crear 4 documentos markdown con ideas para el futuro
- Entregar el producto terminado, no por tandas

**Qué NO tenés que hacer:**
- No tocar Supabase ni Telegram (todavía)
- No eliminar datos de demo
- No cambiar la estructura de carpetas
- No usar gráficos de torta/polar
- No trabajar por tandas (todo de una vez)

**Stack tecnológico:**
- React 18 + TypeScript + Vite
- Tailwind CSS 4
- React Router DOM 6
- Lucide React (iconos)
- Recharts (gráficos)
- Estado: React Context + localStorage

**Entregables:**
1. Proyecto funcional con los 22 puntos implementados
2. 4 documentos markdown en `/docs/`
3. Build exitoso sin errores
4. Resumen de cambios realizados

**Tiempo estimado:** 2-4 horas de trabajo continuo

---

## ⚠️ IMPORTANTE: ESTRATEGIA DE TRABAJO

Este proyecto ya tiene una versión funcional creada por otro asistente de IA. El usuario te va a pasar un ZIP con el código actual.

### Tu estrategia de trabajo:

**PASO 1: Crear estructura de trabajo**
Antes de hacer cualquier cambio, creá esta estructura:
```
/prode-original/     ← Aquí van los archivos del ZIP (NO MODIFICAR)
/prode-mejorado/     ← Aquí vas a trabajar y hacer los cambios
```

**PASO 2: Copiar archivos**
1. Leé todos los archivos del ZIP que te pasó el usuario
2. Copiá cada archivo a `/prode-mejorado/` manteniendo la misma estructura
3. Verificá que el proyecto compile con `npm run build` en `/prode-mejorado/`

**PASO 3: Trabajar sobre la copia**
- Todos los cambios que hagas deben ser en `/prode-mejorado/`
- NUNCA modifiques los archivos en `/prode-original/`
- Si necesitás consultar cómo estaba algo originalmente, leé `/prode-original/`

**PASO 4: Al finalizar**
- El usuario tendrá dos carpetas completas
- `/prode-original/` = versión original (lo que hizo el otro asistente)
- `/prode-mejorado/` = versión con tus mejoras

### Archivos críticos (hacé backup antes de modificar)
Estos archivos son la base del sistema. Antes de modificarlos, creá una copia con sufijo `.backup`:
- `src/types.ts` → `src/types.ts.backup`
- `src/utils.ts` → `src/utils.ts.backup`
- `src/seed.ts` → `src/seed.ts.backup`
- `src/store.tsx` → `src/store.tsx.backup`

### Si algo sale mal
Si rompés algo y no sabés cómo arreglarlo:
1. Compará el archivo roto con su versión en `/prode-original/`
2. Restaurá el archivo original si es necesario
3. Volvé a intentar el cambio de forma más conservadora

---

## 📋 CONTEXTO

### Qué es este proyecto
Estás construyendo una **web app de pronósticos deportivos** llamada "PRODE LIGA" para la Liga Argentina de fútbol. Los usuarios entran, pronostican resultados de partidos (Local/Empate/Visitante), pagan una entrada, y el que más acierta se lleva el 80% del pozo acumulado. El dueño del negocio se queda con el 20%.

### Estado actual
Ya existe una versión funcional de la app construida con React + TypeScript + Vite + Tailwind CSS. El proyecto actual tiene:
- Estructura completa con todas las pantallas
- Sistema de autenticación (registro/login)
- Panel de administración completo
- Tabla de clasificación en tiempo real
- Sistema de pagos con comprobantes
- Gestión de fechas, partidos, resultados y premios
- Parser de fixtures de Promiedos
- Datos de demostración precargados

### Problema
La versión actual tiene problemas de UX, seguridad, escalabilidad y funcionalidades faltantes que necesitan ser resueltos antes de lanzar a producción.

---

## 🎯 OBJETIVO

Construir la versión final y completa de PRODE LIGA aplicando todas las mejoras y cambios especificados en este documento, manteniendo la funcionalidad existente pero mejorando significativamente la experiencia de usuario, seguridad y escalabilidad.

### Objetivos específicos
1. **Seguridad**: Proteger completamente el panel de administración
2. **UX**: Mejorar flujos críticos (pago, edición de pronósticos, compartir)
3. **Escalabilidad**: Preparar para migración a Supabase (storage, auth)
4. **Funcionalidades**: Agregar perfil de usuario, estadísticas, PWA, accesibilidad
5. **Documentación**: Crear documentos de referencia para features futuras

---

## 📚 FUENTES A USAR

### Archivos existentes en el proyecto
```
/
├── index.html
├── package.json
├── src/
│   ├── App.tsx (componente principal con routing)
│   ├── main.tsx (entry point)
│   ├── index.css (estilos globales con Tailwind)
│   ├── types.ts (definiciones TypeScript)
│   ├── utils.ts (funciones helper, parser, cálculos)
│   ├── seed.ts (datos de demostración)
│   ├── store.tsx (estado global con React Context)
│   ├── components/
│   │   ├── ui.tsx (componentes UI reutilizables)
│   │   └── modals.tsx (modales de auth, pago, etc.)
│   ├── pages/
│   │   ├── Home.tsx (pantalla principal del jugador)
│   │   ├── Ranking.tsx (tabla de clasificación)
│   │   ├── Guide.tsx (guía para el jugador)
│   │   └── admin/
│   │       ├── AdminPage.tsx (panel de administración)
│   │       ├── PaymentsTab.tsx (gestión de pagos)
│   │       ├── RoundsTab.tsx (gestión de fechas)
│   │       ├── ResultsTab.tsx (carga de resultados)
│   │       └── OpsTab.tsx (premios, ajustes, pruebas)
│   └── public/ (para PWA: manifest, icons, sw.js)
└── docs/ (documentos markdown a crear)
```

### Especificación técnica original
El proyecto incluye una especificación técnica completa (ver archivo `ESPECIFICACION_TECNICA.md` si existe, o usar la estructura de datos y reglas de negocio definidas en `types.ts` y `utils.ts`).

### Stack tecnológico
- **Frontend**: React 18 + TypeScript + Vite
- **Estilos**: Tailwind CSS 4
- **Routing**: React Router DOM 6
- **Iconos**: Lucide React
- **Estado**: React Context + localStorage (modo demo)
- **Animaciones**: Framer Motion (opcional, ya instalado)
- **Charts**: Recharts (para estadísticas del admin)

---

## ✅ ENTREGABLES

### 1. Código funcional
Aplicar los siguientes 22 puntos de mejora en el orden especificado:

#### 🔴 PRIORIDAD ALTA

**Punto 1 - Protección total del admin (15-20 min)**
- Ruta `/admin` solo renderiza si `me.role === 'admin'`
- Si no es admin, mostrar "Acceso denegado" sin revelar nada
- Validar rol en TODAS las acciones del store (`approvePayment`, `setResult`, `settleRound`, etc.)
- Eliminar link "Admin" de la navegación para usuarios comunes
- Eliminar chip "Admin" del header para usuarios comunes
- Si usuario común intenta entrar a `/admin` por URL, ver pantalla de acceso denegado

**Punto 2 - Refactor de autenticación (25-35 min)**
- **Registro**: Solo apodo + email + contraseña (eliminar nombre real y teléfono del registro)
- **Login**: Aceptar apodo O email + contraseña
- **Mensaje sobre correo**: "El correo sirve para recuperar tu cuenta si olvidás la contraseña. Usá un correo al que tengas acceso: si ponés uno que no es tuyo, no vas a poder recuperar la cuenta."
- **Sin verificación de correo**: Registro inmediato
- Actualizar `types.ts`: `Profile` ya no tiene `fullName` ni `phone` obligatorios (se piden al reclamar premio)
- Actualizar `seed.ts`: usuarios demo con solo apodo, email, password
- Actualizar `AuthModal`: nuevo flujo de registro y login
- Actualizar `store.tsx`: métodos `register` y `login` aceptan apodo o email

**Punto 3 - Compresión mejorada de comprobantes (10-15 min)**
- En `utils.ts`, función `fileToDataUrl`:
  - Cambiar `scale = Math.min(1, 1000 / ...)` a `700`
  - Cambiar `toDataURL("image/jpeg", 0.72)` a `0.55`
- Agregar detector de storage lleno: envolver `localStorage.setItem` en try/catch
- Si falla, mostrar mensaje: "Almacenamiento lleno. Contactá al administrador."
- Dejar código preparado para migración a Supabase Storage (función `uploadReceipt`)

**Punto 4 - Pantalla completa de pago + recordatorio drafts (30-40 min)**
- Crear `src/pages/PaymentScreen.tsx` como ruta `/pago/:predictionId`
- Mover lógica de `PaymentModal` a esta pantalla completa
- Mostrar resumen visual del pronóstico (14 chips L/E/V con equipos)
- Botón "Volver a editar" que regresa a home con selecciones intactas (guardar en sessionStorage)
- En `Home.tsx`, agregar banner persistente si hay drafts: "Tenés 1 pronóstico sin pagar para la Fecha X → [Pagar ahora]"
- Reemplazar `setPayId` por `navigate('/pago/' + id)` en Home

**Punto 5 - Editar pronósticos draft/rechazados (25-35 min)**
- En `store.tsx`, agregar método `updatePredictionItems(predictionId, items)`
  - Validar que pronóstico esté en `draft` o `rejected`
  - Validar que fecha siga abierta
  - Reemplazar `items` y resetear `paymentStatus` a `draft` si estaba `rejected`
- En `Home.tsx`, agregar estado `editingPredictionId` que precarga `selections`
- Modificar `savePrediction` para detectar `editingPredictionId` y llamar a `updatePredictionItems`
- Agregar botón "Editar" en pronósticos draft/rejected en "Mis pronósticos"
- Agregar botón "Eliminar" con confirmación para borrar pronósticos draft

**Punto 6 - Eliminar botón "Restablecer datos" (5 min)**
- En `OpsTab.tsx`, eliminar completamente el botón "Restablecer datos de demostración"
- Eliminar método `resetAll` del store si no se usa en otro lado

**Punto 7 - Documentar regla del resto del pozo + quitar 80/20 (15-20 min)**
- En `utils.ts`, función `winnersInfo`: agregar campo `remainder = pozo - (perWinner * winnerIds.length)`
- En `ResultsTab.tsx`, mostrar desglose: "3 ganadores × $2.666 = $7.998 · Resto: $2 → comisión admin"
- En `ClaimModal.tsx`, agregar texto: "Tu premio: $X (pozo de $Y dividido entre Z ganadores)"
- **QUITAR toda mención de 80/20** excepto en:
  - `Guide.tsx` (sección de reglas)
  - Panel de estadísticas del admin (punto 20)
- En `Home.tsx`, scoreboard: cambiar "80% de lo recaudado" por "Pozo para el ganador"
- En `Ranking.tsx`, eliminar cualquier mención de porcentajes

**Punto 8 - Pantalla "Mi perfil" con historial (35-45 min)**
- Crear `src/pages/Profile.tsx` con ruta `/perfil`
- En `utils.ts`, función `getUserStats(userId)` que devuelve:
  - `roundsPlayed`: fechas con al menos 1 pronóstico approved
  - `totalHits`: suma de `totalHits` de todos los pronósticos approved
  - `totalMatches`: suma de partidos válidos de esas fechas
  - `positions`: array de posiciones en cada fecha
  - `avgPosition`: promedio
  - `totalWon`: suma de `prizes.amount` donde `userId`
  - `currentStreak`: racha actual de fechas con > X aciertos
- **NO mostrar**: total apostado ni balance
- Mostrar: Fechas jugadas, Aciertos totales (%), Posición promedio, Total ganado, Racha actual
- Sección "Historial de fechas": lista de fechas jugadas con aciertos y posición
- Agregar link en header (avatar del usuario) que navega a `/perfil`

**Punto 9 - Tabla mobile más legible (15-20 min)**
- En `Ranking.tsx`, modificar `<table>`:
  - Agregar `min-w` calculado según cantidad de partidos
  - Reducir padding de celdas: `px-1 py-1.5` en vez de `px-1 py-2`
  - Agregar `title` attribute en cada celda de partido para tooltip nativo
- Mejorar columna sticky:
  - Fondo más oscuro: `bg-pitch-800` en vez de `bg-pitch-900`
  - Sombra a la derecha: `box-shadow: 4px 0 8px -4px rgba(0,0,0,0.5)`
  - Borde derecho sutil

**Punto 10 - Botón de compartir (10-15 min)**
- En `Home.tsx`, agregar botón "Compartir" con ícono `<Share2 />`
- Función `handleShare()`:
  ```typescript
  const shareData = {
    title: 'Prode Liga',
    text: `🏆 Sumate al Prode de la Liga\nPozo: ${fmtMoney(stats.pozo)}\nEntrada: ${fmtMoney(db.settings.entryFee)}`,
    url: window.location.href
  };
  if (navigator.share) {
    await navigator.share(shareData);
  } else {
    await navigator.clipboard.writeText(window.location.href);
    toast.push('ok', 'Link copiado');
  }
  ```

**Punto 11 - Ticker movido a tabla + contador en home (15-20 min)**
- En `Home.tsx`, reemplazar ticker animado por contador simple: "12 jugadores participando en esta fecha"
- En `Ranking.tsx`, mover ticker arriba de la tabla
- Componente `<Ticker />` muestra últimos 6 jugadores que se sumaron

**Punto 12 - Parser de Promiedos más robusto (25-35 min)**
- En `utils.ts`, función `parseFixture()`:
  - Limpiar sufijos: `line.replace(/\s*\([^)]+\)\s*/g, '')` (elimina `(TNT)`, `(ESPN)`, etc.)
  - Mejorar regex de horario: `/(\d{1,2})\s*[.:]\s*(\d{2})\s*(hs\.?)?/i`
  - Detectar líneas combinadas: `/^(?:[a-zá-ú]+\s+)?(\d{1,2})\s*[/\-]\s*(\d{1,2})\s*[-–—]\s*(\d{1,2})\s*[.:]\s*(\d{2})/i`
  - Calcular `ignoredPercentage = ignored / lines.length`
- En `RoundsTab.tsx`, `ParserModal`:
  - Mostrar warning si `ignoredPercentage > 0.3`
  - Mostrar lista de líneas ignoradas en `<details>` colapsable

**Punto 13 - Vista de recaudación histórica en admin (30-40 min)**
- En `utils.ts`, función `getAdminStats()`:
  - `totalRounds`: fechas con status `settled`
  - `totalRevenue`: suma de `approvedCount * entryFee`
  - `totalPrizes`: suma de `prizes.amount`
  - `totalCommission`: `totalRevenue - totalPrizes`
  - `avgRevenuePerRound`: `totalRevenue / totalRounds`
  - `roundsDetail`: array de `{ roundId, roundName, status, revenue, prizes, commission }`
- Crear `src/pages/admin/HistoryTab.tsx`
- Agregar pestaña en `AdminPage.tsx` con ícono `<TrendingUp />`

**Punto 14 - Estados vacíos más amigables (15-20 min)**
- Mejorar componente `EmptyState` en `ui.tsx`:
  - Agregar ilustraciones SVG inline (pelota, trofeo, silbato, tabla)
  - Mensajes más cálidos y descriptivos
  - Animación fade-in + scale
- Reemplazar todos los `<EmptyState>` existentes

**Punto 15 - PWA instalable (30-40 min)**
- Crear `public/manifest.json`:
  ```json
  {
    "name": "Prode Liga",
    "short_name": "Prode",
    "start_url": "/",
    "display": "standalone",
    "background_color": "#060b09",
    "theme_color": "#10b981",
    "icons": [
      { "src": "/icon-192.png", "sizes": "192x192", "type": "image/png" },
      { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png" }
    ]
  }
  ```
- Crear `public/sw.js` (service worker básico con cache)
- Registrar service worker en `main.tsx`
- Generar íconos con IA (usar herramienta `generate_image`)
- Agregar meta tags en `index.html`: `<link rel="manifest">`, `<meta name="theme-color">`, `<link rel="apple-touch-icon">`

**Punto 16 - Accesibilidad (35-45 min)**
- En `ui.tsx`, componente `Modal`:
  - Agregar `role="dialog"` y `aria-modal="true"`
  - Implementar focus trap con `useEffect` que escucha `keydown` de Tab
  - Agregar `aria-labelledby` apuntando al título
- En todos los botones con solo íconos, agregar `aria-label` descriptivo
- En `index.css`, cambiar `text-zinc-500` a `text-zinc-400` globalmente
- Agregar `<a href="#main" className="sr-only focus:not-sr-only">Saltar al contenido</a>` al inicio del `<body>`

**Punto 17 - Pronósticos con nombre opcional (15-20 min)**
- Agregar campo `name` a la tabla `predictions` (opcional, default: null)
- En `PaymentModal` (o `PaymentScreen`), agregar input "Nombre del pronóstico (opcional)"
- En `Home.tsx`, mostrar el nombre en "Mis pronósticos" si existe
- En `Ranking.tsx`, mostrar el nombre entre paréntesis si existe: "ElCaudillo (El racional)"

**Punto 18 - Exportar tabla a imagen (30-40 min)**
- Instalar librería: `npm install html2canvas`
- Crear componente `ShareableCard` con diseño de tarjeta (logo, nombre, posición, aciertos, pozo, link)
- En `Ranking.tsx`, agregar botón "Compartir mi posición"
- Función que:
  1. Renderiza `ShareableCard` off-screen
  2. Lo convierte a imagen con `html2canvas`
  3. Abre share sheet con la imagen

**Punto 19 - Fechas de prueba sin datos automáticos (10-15 min)**
- En `store.tsx`, eliminar método `seedTestRound`
- En `OpsTab.tsx`, `TestTab`:
  - Eliminar botón "Crear fecha de prueba completa"
  - Dejar solo botón "Aprobar todos los pagos pendientes"
  - Agregar aviso: "Las fechas de prueba se crean desde la pestaña Fechas marcando 'Modo prueba'"

**Punto 20 - Sección de estadísticas y contabilidad del admin (45-60 min)**
- Crear `src/pages/admin/StatsTab.tsx`
- Agregar pestaña "Estadísticas" en `AdminPage.tsx` con ícono `<BarChart3 />`
- **Contabilidad**:
  - Recaudado total
  - Pagado en premios
  - Comisión acumulada (20%)
  - Detalle por fecha
- **Estadísticas de uso**:
  - Visitas desde links compartidos (contador por usuario)
  - Registros desde links compartidos
  - Jugadores con 1 pronóstico vs 2+ pronósticos
  - Tasa de conversión (guardados vs pagados)
- **Gráficos** (usar Recharts, NO torta ni polar):
  - Gráfico de líneas: evolución de recaudación por fecha
  - Gráfico de barras: jugadores por cantidad de pronósticos
- Agregar tracking de shares: en `handleShare()`, incrementar contador en localStorage

**Punto 21 - Guía solo para jugador (10-15 min)**
- En `Guide.tsx`, eliminar toda la sección de setup (Supabase, Telegram, Vercel)
- Dejar solo la guía para el jugador (cómo jugar, cómo funciona el prode)
- Eliminar checklist de prueba (era para el admin)

**Punto 22 - Documentos markdown (30-40 min)**
Crear 4 archivos en `/docs/`:

1. **`docs/referidos.md`** (Punto 16 original):
   - Idea: Sistema de referidos "Invitá a un amigo y jugá gratis"
   - Flujo completo con link único
   - Contabilidad: créditos, validación, fraude
   - Tabla nueva en Supabase: `referrals`
   - UI mockup
   - Pasos para implementar

2. **`docs/quiniela.md`** (Punto 18 original):
   - Idea: Modo quiniela con combinadas opcionales
   - Ejemplos: "Los primeros 5 todos local", "Exactamente 10 aciertos"
   - Contabilidad: precio extra por combinada, premios extra
   - Tabla nueva: `bets`
   - UI mockup
   - Pasos para implementar

3. **`docs/notificaciones.md`** (Punto 19 original):
   - Idea: Notificaciones push para cierres, pagos, premios, resultados
   - Implementación: Notification API, Firebase Cloud Messaging
   - Tipos de notificaciones y cuándo enviarlas
   - Permisos del usuario
   - Pasos para implementar

4. **`docs/liga-privada.md`** (Punto 21 original):
   - Idea: Modo liga privada para grupos de amigos
   - Cómo funcionaría: crear liga, alias propio, comisión de plataforma
   - **Explicar "refactor completo"**: significa reestructurar todo el código para soportar múltiples ligas independientes (cambiar tablas, agregar `leagueId` a todo, filtrar datos por liga, sistema de comisiones)
   - Tabla nueva: `leagues`
   - Impacto en el código actual
   - Pasos para implementar

### 2. Build exitoso
- Ejecutar `npm run build` al final de cada tanda
- No debe haber errores de TypeScript
- No debe haber errores de compilación

### 3. Funcionalidad verificable
Cada punto debe ser probable manualmente:
- Protección admin: intentar entrar a `/admin` como usuario común
- Auth: registrar con apodo, login con apodo o email
- Comprobantes: subir imagen y verificar que se comprime
- Pago: guardar pronóstico y ver pantalla completa
- Editar: editar pronóstico draft y ver que se actualiza
- Perfil: ver historial de fechas jugadas
- Tabla: hacer scroll horizontal en mobile y ver columna sticky
- Compartir: tocar botón y ver share sheet (mobile) o link copiado (desktop)
- Ticker: ver contador en home y ticker en tabla
- Parser: pegar texto con formatos raros y ver que parsea bien
- Estadísticas: ver gráficos en panel admin
- Estados vacíos: ver ilustraciones cuando no hay datos
- PWA: instalar app en mobile
- Accesibilidad: navegar con teclado y ver focus trap
- Pronósticos con nombre: crear pronóstico con nombre y verlo en tabla
- Exportar tabla: generar imagen y compartirla
- Fechas de prueba: crear manualmente desde pestaña Fechas
- Guía: ver solo guía para jugador, no setup

---

## 🚫 LÍMITES - LO QUE NO PUEDES HACER

### No tocar
1. **Supabase**: No implementar migración a Supabase todavía. Mantener localStorage.
2. **Telegram**: No implementar notificaciones por Telegram. Solo documentar en markdown.
3. **Datos de demo**: No eliminar los datos de demostración precargados (Fechas 6, 7, 8, usuarios demo).
4. **Estructura de carpetas**: No reorganizar la estructura de archivos existente.
5. **Dependencias principales**: No cambiar React, TypeScript, Vite, Tailwind.

### No hacer
1. **No agregar features nuevas** fuera de los 22 puntos especificados (excepto los documentos markdown).
2. **No cambiar el diseño visual** drásticamente. Mantener el estilo actual (dark mode, glassmorphism, verde/dorado).
3. **No eliminar funcionalidades existentes** que no estén en la lista de cambios.
4. **No modificar la lógica de negocio** (cálculo de pozo, aciertos, ganadores) excepto donde se especifique.
5. **No agregar gráficos de torta o polar** en estadísticas. Solo líneas y barras.

### No asumir
1. **No asumir que el usuario sabe programar**. Todos los mensajes de error deben ser claros y en español.
2. **No asumir que hay backend**. Todo debe funcionar con localStorage por ahora.
3. **No asumir que hay verificación de correo**. El registro es inmediato.
4. **No asumir que el admin necesita ver el 80/20**. Solo en reglas y estadísticas.

---

## ✅ DEFINICIÓN DE COMPLETADO

El proyecto está **COMPLETO** cuando:

### 1. Todos los 22 puntos están implementados
- Cada punto funciona según su descripción
- No hay errores de TypeScript
- El build pasa sin errores

### 2. Los 4 documentos markdown están creados
- `docs/referidos.md`
- `docs/quiniela.md`
- `docs/notificaciones.md`
- `docs/liga-privada.md`
- Cada documento tiene: idea, flujo, contabilidad, UI mockup, pasos de implementación

### 3. La funcionalidad es verificable
Cada punto puede probarse manualmente siguiendo los casos de uso especificados en "Entregables".

### 4. No hay regresiones
- Todas las funcionalidades existentes siguen funcionando
- No se rompieron flujos críticos (registro, login, pronóstico, pago, tabla, admin)

### 5. El código es limpio
- No hay código comentado sin usar
- No hay archivos temporales
- No hay console.log de debugging
- Los nombres de variables y funciones son descriptivos

### 6. La app está lista para producción (excepto Supabase)
- Se puede publicar en Vercel/Netlify
- Funciona en mobile y desktop
- Es instalable como PWA
- Es accesible (navegable con teclado)

---

## 📝 NOTAS FINALES

### Prioridades
Si hay que elegir entre calidad y cantidad, priorizar:
1. **Seguridad** (protección admin)
2. **Funcionalidad crítica** (auth, pago, edición)
3. **UX** (compartir, perfil, tabla)
4. **Extras** (PWA, accesibilidad, estadísticas)

### Testing
Después de cada tanda de puntos, probar:
1. Registro y login con apodo
2. Guardar pronóstico y pagar
3. Editar pronóstico draft
4. Ver perfil con historial
5. Tabla en mobile
6. Panel admin completo

### Comunicación
Si hay ambigüedad en algún punto, preguntar antes de implementar. No asumir.

---

## 🚀 INSTRUCCIONES DE EJECUCIÓN

### Modo de trabajo: ENTREGA COMPLETA

**NO trabajes por tandas. NO preguntes si podés continuar. Implementá TODO de una sola vez.**

Tu objetivo es entregar el producto terminado con los 22 puntos implementados y los 4 documentos markdown.

### Flujo de trabajo:

1. **Leé y entendé** todos los archivos del proyecto original
2. **Creá la estructura** `/prode-original/` y `/prode-mejorado/`
3. **Copiá todos los archivos** a `/prode-mejorado/`
4. **Implementá los 22 puntos** en el orden especificado, uno tras otro
5. **Creá los 4 documentos markdown** en `/docs/`
6. **Hacé build** al final: `npm run build`
7. **Verificá** que no haya errores de TypeScript ni de compilación
8. **Entregá** el proyecto completo

### Reglas críticas:

- **NO pares a mitad de camino.** Si encontrás un error, arreglalo y continuá.
- **NO preguntes "¿continúo?"** Continuá automáticamente.
- **NO dejes nada a medias.** Si un punto requiere 5 archivos, modificá los 5.
- **Si algo no funciona, intentá de nuevo** con un enfoque diferente.
- **Si un punto es muy complejo**, dividilo en sub-pasos internos pero no lo dejes incompleto.

### Orden de implementación (seguí este orden estrictamente):

1. Punto 24 - Protección total del admin
2. Punto 10 - Refactor de autenticación
3. Punto 3 - Compresión mejorada de comprobantes
4. Punto 1 - Pantalla completa de pago + recordatorio drafts
5. Punto 2 - Editar pronósticos draft/rechazados
6. Punto 22 - Eliminar botón "Restablecer datos"
7. Punto 4 + quitar 80/20 - Documentar regla resto del pozo
8. Punto 5 - Pantalla "Mi perfil" con historial
9. Punto 6 - Tabla mobile más legible
10. Punto 7 - Botón de compartir
11. Punto 23 - Ticker movido a tabla + contador en home
12. Punto 8 - Parser de Promiedos más robusto
13. Punto 9 - Vista de recaudación histórica en admin
14. Punto 12 - Estados vacíos más amigables
15. Punto 13 - PWA instalable
16. Punto 14 - Accesibilidad (a11y)
17. Punto 17 - Pronósticos con nombre opcional
18. Punto 20 - Exportar tabla a imagen
19. Punto 15 - Fechas de prueba sin datos automáticos
20. Extras - Sección estadísticas y contabilidad admin
21. Extras - Guía solo para jugador
22. Documentos markdown (4 archivos)

### Al finalizar cada punto:

- Verificá que el código compile sin errores
- Si hay errores, arreglalos antes de pasar al siguiente punto
- No dejes código comentado sin usar
- No dejes console.log de debugging

### Al finalizar TODO:

1. Ejecutá `npm run build` y verificá que no haya errores
2. Verificá que los 4 documentos markdown existan en `/docs/`
3. Hacé un resumen de lo implementado
4. Listá los archivos que modificaste
5. Confirmá que el proyecto está listo para producción

### Si encontrás problemas:

- **Error de TypeScript**: Leé el error, entendé qué tipo falta, y corregilo
- **Error de compilación**: Revisá el archivo que causa el error y corregilo
- **Funcionalidad que no funciona**: Probá diferentes enfoques hasta que funcione
- **Dependencia faltante**: Instalala con `npm install`

### Criterios de completado:

El proyecto está COMPLETO cuando:
- ✅ Los 22 puntos están implementados
- ✅ Los 4 documentos markdown están creados
- ✅ `npm run build` pasa sin errores
- ✅ No hay errores de TypeScript
- ✅ Todas las funcionalidades existentes siguen funcionando
- ✅ El código está limpio (sin console.log, sin código comentado)

---

**FIN DEL PROMPT**

---

## 📝 NOTA FINAL PARA ANTIGRAVITY

Este prompt es extenso pero completo. Leélo entero antes de empezar. No saltees ninguna sección.

Tu trabajo es entregar un producto terminado y funcional. No trabajes por tandas, no preguntes si podés continuar, simplemente implementá todo de una vez.

Si en algún momento te quedás bloqueado, volvé a leer el punto específico que estás implementando y probá un enfoque diferente.

**Empezá ahora.**
