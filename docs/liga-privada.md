# Modo Liga Privada: Torneos entre Amigos y Empresas

## 1. Visión y Propósito
El motor principal del fútbol es el folclore y la rivalidad entre amigos, compañeros de oficina, familias y peñas. La función de **Ligas Privadas** permite a los usuarios competir no solo en la tabla global comunitaria, sino en un espacio exclusivo y cerrado donde pueden medirse directamente contra su círculo de confianza.

---

## 2. Modalidades de Liga Privada

### Modalidad A: "Pizarra de Amigos" (Filtro sobre el Prode General)
- **Cómo funciona**:
  - Los participantes siguen jugando la fecha oficial de Prode Liga (pagan la misma entrada general y compiten por el pozo principal de toda la comunidad).
  - Dentro de la app, crean o se unen a una "Liga de Amigos" (ej. *"Los Viejos de la Pipa"*, *"Oficina Tech"*).
  - La app les brinda una vista exclusiva de la tabla de posiciones donde solo aparecen los miembros de su grupo.
- **Monetización**: Sin costo extra. Funciona como palanca de retención y viralidad para engrosar el pozo principal.

### Modalidad B: "Pozo Exclusivo del Grupo" (Mini-Prode Autónomo)
- **Cómo funciona**:
  - El creador del grupo define una entrada propia (ej. $2.000 por persona) y una cuenta CBU/Alias propia de su grupo o recolectada por la plataforma.
  - El 100% de lo recaudado en ese grupo (menos una comisión de plataforma) conforma el pozo exclusivo a repartir entre los amigos de esa liga.
- **Monetización**: La plataforma cobra una comisión de servicio fija o porcentual (ej. 10% del pozo o una tarifa única de $1.500 por fecha administrada por grupo).

### Modalidad C: "Torneo Largo Acumulativo" (Todo el Campeonato Apertura)
- **Cómo funciona**:
  - A diferencia del prode semanal que se reinicia fecha a fecha, este modo suma los aciertos de las 27 fechas del torneo Apertura.
  - Premia la constancia a lo largo de todo el semestre.

---

## 3. Experiencia de Usuario (User Journey)

### 3.1 Creación de la Liga
1. El usuario accede a la sección *"Ligas Privadas"*.
2. Pulsa *"Crear mi Liga"*, asigna un nombre (ej. *"Amigos del Fútbol 5"*) y opcionalmente un escudo o avatar.
3. Se genera instantáneamente un código de 6 caracteres (ej. `FUTBOL5`) y un enlace directo de WhatsApp:
   `https://prode.ar/#/liga/FUTBOL5`

### 3.2 Unirse a una Liga
- Los invitados hacen clic en el enlace o ingresan el código en la pantalla de ligas.
- Al confirmar, pasan a formar parte de la tabla del grupo. Un usuario puede pertenecer a múltiples ligas en simultáneo sin tener que cargar pronósticos repetidos (su pronóstico semanal puntúa para todas sus ligas).

### 3.3 Dashboard y Clasificación del Grupo
- Tabla personalizada con orden de mérito del grupo.
- Contador de partidos en vivo con diferencias de pronósticos ("quién le puso a quién").
- Tarjeta de *"El rey de la fecha"* y *"El peor pronosticador"* (para el folclore del grupo).
- Botón rápido para compartir captura de la tabla directamente al grupo de WhatsApp.

---

## 4. Modelo de Datos y Arquitectura de Base de Datos

```typescript
interface PrivateLeague {
  id: string;
  name: string;
  code: string;           // Código alfanumérico único (ej. "ASADO26")
  creatorUserId: string;  // Administrador de la liga
  mode: "leaderboard_only" | "exclusive_pot" | "championship_long";
  entryFee?: number;      // En caso de pozo propio
  members: Array<{
    userId: string;
    joinedAt: string;
    role: "admin" | "member";
  }>;
  createdAt: string;
}
```

### Cálculo de Posiciones sin Duplicación de Pronósticos
No se duplican las elecciones de partidos: el sistema toma el pronóstico existente del usuario para la fecha (`Prediction`) y simplemente filtra los resultados por los IDs de los usuarios miembros de la liga:
```typescript
const getLeagueRanking = (league: PrivateLeague, roundId: string) => {
  const memberIds = league.members.map(m => m.userId);
  return db.predictions
    .filter(p => p.roundId === roundId && p.paymentStatus === "approved" && memberIds.includes(p.userId))
    .sort((a, b) => b.totalHits - a.totalHits);
};
```

---

## 5. Estrategia de Lanzamiento
1. **Beta cerrada en grupos seleccionados**: Invitar a 3 grupos de amigos reales a probar la modalidad A durante 2 fechas.
2. **Premios especiales a la Liga más numerosa**: Otorgar un premio estímulo (ej. un cajón de bebidas o un bono de $20.000) a la peña o grupo de trabajo que logre sumar más de 15 jugadores activos pagados en una fecha.
