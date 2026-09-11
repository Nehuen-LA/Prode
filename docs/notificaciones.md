# Estrategia Integral de Notificaciones: Prode Liga

## 1. Importancia Estratégica
En una aplicación de pronósticos deportivos con fechas semanales, la retención y la puntualidad lo son todo:
- El 65% de los pronósticos se cargan en las últimas 24 horas antes del primer partido.
- Más del 20% de los usuarios que arman un pronóstico se olvidan de transferir o subir el comprobante si no reciben un aviso a tiempo.
- La confirmación instantánea de acreditación del pago erradica la ansiedad del jugador.

---

## 2. Comparativa de Canales de Comunicación

| Canal | Tasa de Apertura | Costo por Envío | Dificultad Técnica | Experiencia de Usuario |
| :--- | :--- | :--- | :--- | :--- |
| **Telegram Bot** | 85% - 95% | **Gratis** (API ilimitada) | Baja | Excelente para usuarios tech / comunidades de fútbol |
| **Web Push (PWA)** | 40% - 60% | **Gratis** (VAPID nativo) | Media | Directo al celular del usuario sin apps de terceros |
| **WhatsApp (Cloud API)** | 95% - 98% | ~$0.04 - $0.06 USD / convo | Media/Alta | Máximo alcance en Argentina (masivo pero costoso) |
| **Email Transaccional** | 20% - 35% | Gratis (hasta 3.000/mes con Resend) | Muy baja | Ideal para recibos, contraseñas y avisos legales |

---

## 3. Matriz de Eventos y Disparadores (Triggers)

### Trigger 1: Apertura de Fecha
- **Momento**: Apenas el administrador publica el fixture de la próxima fecha.
- **Canal recomendado**: Telegram Channel + Web Push.
- **Mensaje tipo**:
  > ⚽ *¡Abrió la Fecha 9 de la Liga! Ya podés cargar tus pronósticos para los 14 partidos del fin de semana. El pozo inicial arranca en $50.000.*

### Trigger 2: Recordatorio de Cierre de Fecha (Cuenta regresiva)
- **Momento**: 24 horas y 2 horas antes de que comience el primer partido.
- **Segmentación**: Únicamente a usuarios registrados que todavía no enviaron su pronóstico en la fecha activa.
- **Canal**: Web Push + Telegram Bot privado.
- **Mensaje tipo**:
  > ⏳ *¡Atención! La Fecha 9 cierra en 2 horas (18:45 hs). No te quedes afuera del pozo de $120.000.*

### Trigger 3: Rescate de Borradores (Pronósticos sin pagar)
- **Momento**: 3 horas después de guardar el pronóstico si sigue en estado `draft`, y un recordatorio final 1 hora antes del cierre de fecha.
- **Segmentación**: Usuarios con `paymentStatus === 'draft'`.
- **Canal**: Web Push + Email / Telegram.
- **Mensaje tipo**:
  > ⚠️ *Guardaste tu pronóstico pero no subiste el comprobante. Transferí tu entrada antes del cierre para que tu pronóstico entre en juego.*

### Trigger 4: Validación de Pago (Aprobado / Rechazado)
- **Momento**: Inmediato cuando el admin pulsa "Aprobar" o "Rechazar" en el panel.
- **Canal**: Email transaccional + Web Push / Telegram.
- **Mensaje tipo (Aprobado)**:
  > ✅ *¡Pago verificado! Tu pronóstico ya está activo en la tabla de la Fecha 9. ¡Muchos éxitos!*
- **Mensaje tipo (Rechazado)**:
  > ❌ *Tu comprobante no pudo validarse (importe incorrecto o ilegible). Ingresá a la app y subí un nuevo comprobante para no perder tu lugar.*

### Trigger 5: Liquidación de Fecha y Proclamación de Ganadores
- **Momento**: Cuando finaliza el último partido de la fecha y el admin liquida los resultados.
- **Canal**: Todos los canales.
- **Mensaje tipo**:
  > 🏆 *¡Finalizó la Fecha 9! Felicitaciones a @ElCaudillo por ganar el pozo de $98.500 con 13 aciertos. Entrá a ver la tabla final.*

### Trigger 6: Aviso Exclusivo al Ganador
- **Momento**: Inmediato al liquidar.
- **Mensaje tipo**:
  > 🎉 *¡FELICITACIONES! Fuiste el ganador de la Fecha 9. Ingresá a la app para indicar tu CBU/Alias y cobrar tu premio de $98.500.*

---

## 4. Hoja de Ruta de Implementación Técnica

### Fase 1: Telegram Bot (Prioridad Inmediata - Costo Cero)
- Creación del bot `@ProdeLigaBot` con BotFather.
- En la app: botón en "Mi Perfil" para "Vincular Telegram" generando un token temporal `/start <token>`.
- Almacenar el `telegramChatId` en el perfil de usuario en la base de datos.
- Webhook o llamada HTTPS simple desde el backend/Edge Function ante cada evento.

### Fase 2: Web Push PWA (Retención en Navegador)
- Configuración de claves VAPID (`web-push` en Node o Supabase Functions).
- Solicitar permiso al usuario tras su primera jugada exitosa: *"¿Querés que te avisemos cuando empiece la fecha o cuando ganes un premio?"*.
- Guardar la suscripción (`PushSubscription` JSON) asociada al `userId`.

### Fase 3: Email Transaccional (Resend API)
- Integrar Resend con dominio propio (`notificaciones@prode.ar`).
- Plantillas HTML limpias y responsivas para comprobantes y restablecimiento de contraseñas.
