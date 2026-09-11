# Sistema de Referidos: Prode Liga

## 1. Visión y Objetivos
El crecimiento de una plataforma de pronósticos deportivos depende fuertemente de los efectos de red locales: amigos de fútbol, compañeros de trabajo, grupos de WhatsApp de canchas de fútbol 5 y peñas.

El objetivo del sistema de referidos es:
- **Reducir el Costo de Adquisición de Clientes (CAC) a casi cero**, apalancando la motivación orgánica de los jugadores de jugar con sus conocidos.
- **Aumentar el pozo de cada fecha**: a mayor cantidad de participantes, mayor es el atractivo del premio, generando un bucle viral positivo (*flywheel*).
- **Incentivar la recurrencia**: quien invita a sus amigos siente mayor compromiso de participar cada semana.

---

## 2. Mecánica de Incentivos

### 2.1 Modelo Híbrido: "Entradas Gratis + Ticket Dorado"
Para mantener la simplicidad operativa y evitar cuestiones regulatorias complejas con dinero en efectivo directo a usuarios no bancarizados, el esquema recomendado es:

1. **Beneficio para el referente (Quien invita)**:
   - **Por cada 3 amigos referidos** que abonen su primer pronóstico en una fecha:
     - 1 entrada gratis para la fecha siguiente (bonificación del 100% de la entrada).
   - **Hito de Embajador (10 referidos activos acumulados)**:
     - 5% adicional de participación en el pozo de la fecha en la que jueguen al menos 5 de sus referidos, o comisión directa transferible por CBU/Alias.

2. **Beneficio para el referido (El nuevo usuario)**:
   - **Descuento de bienvenida**: 25% o 50% de descuento en su primera entrada (o 2 pronósticos por el precio de 1 en su fecha debut).
   - **Prioridad de validación**: su comprobante se procesa de forma prioritaria.

---

## 3. Arquitectura Técnica y Tracking

### 3.1 Generación de Código y Enlaces
Cada usuario registrado tiene un código único alfanumérico generado en base a su nickname:
- Formato de código: `NICKNAME` o `REF-XXXX` (ej. `ELCAUDILLO`).
- Enlace profundo de invitación:
  `https://prode.ar/?ref=ELCAUDILLO`
  o con fecha específica:
  `https://prode.ar/#/?round=fecha-9&ref=ELCAUDILLO`

### 3.2 Almacenamiento y Atribución
1. **Captura inicial (First Touch & Last Touch)**:
   - Al ingresar con el parámetro `?ref=CODIGO`, se almacena en `localStorage` (`prode_referrer: CODIGO`) y en cookie segura con vigencia de 30 días.
2. **Registro de cuenta**:
   - Al registrarse, el perfil del usuario guarda permanentemente `referredBy: referrerUserId`.
3. **Conversión y Validación**:
   - Una referencia se considera "activa" únicamente cuando el administrador aprueba el primer pago de comprobante (`paymentStatus: 'approved'`).
   - Se evita el fraude de auto-creación de cuentas falsas validando IP, CBU/Alias de origen de la transferencia y comprobante adjunto.

---

## 4. Interfaz de Usuario (UI/UX)

### 4.1 Pantalla "Invitar Amigos" en Mi Perfil
- **Tarjeta destacada**:
  - Código personal visible con botón de copiado en 1 toque.
  - Botón nativo de compartir directo a WhatsApp con texto predefinido:
    > *"¡Sumate al Prode de la Liga! Pronosticá los partidos de este fin de semana y competí por el pozo. Entrá con mi link: https://prode.ar/?ref=ElCaudillo"*
- **Métricas personales en tiempo real**:
  - Amigos registrados.
  - Amigos con entrada pagada.
  - Entradas gratis acumuladas / disponibles.

### 4.2 Panel de Administración (Auditoría de Referidos)
- Pestaña o filtro para que el admin identifique:
  - Top 10 promotores de la comunidad.
  - Conversión de enlaces (clicks vs registros vs pagos aprobados).
  - Alerta de patrones sospechosos (múltiples registros con el mismo comprobante o IP).

---

## 5. Simulación Económica y Retorno de Inversión (ROI)

| Métrica | Sin Sistema de Referidos | Con Sistema de Referidos |
| :--- | :--- | :--- |
| Jugadores por fecha | 50 jugadores | 120 jugadores (+140%) |
| Entrada unitaria | $1.000 | $1.000 |
| Recaudación bruta | $50.000 | $120.000 |
| Costo en entradas bonificadas (free tickets) | $0 | -$8.000 (8 entradas bonificadas) |
| Recaudación neta | $50.000 | $112.000 |
| Pozo al ganador (80%) | $40.000 | $89.600 (+124%) |
| Ganancia organizador (20%) | $10.000 | $22.400 (+124%) |

**Conclusión estratégica**: El costo de otorgar entradas bonificadas se autofinancia con holgura por el volumen incremental de participantes que no habrían llegado sin la recomendación de su círculo cercano.
