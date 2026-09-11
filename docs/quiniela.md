# Modo Quiniela y Pozo Acumulativo (Jackpot)

## 1. Concepto y Justificación Psicológica
En el modelo estándar de Prode ("el que más saca gana el pozo"), cada semana hay un ganador, independientemente de si acertó 14 partidos o solo 8.

El **Modo Quiniela / Pozo Acumulativo** introduce la mecánica del pozo vacante (*Jackpot*):
- Si nadie logra el pleno de aciertos (ej. 14 de 14 partidos), el pozo principal no se reparte en su totalidad, sino que **se acumula para la fecha siguiente**.
- Esto replica la psicología del *Quini 6* o *Loto*: cuando un pozo queda vacante 2 o 3 fechas seguidas, el monto total explota, atrayendo a jugadores casuales que antes no participaban.

---

## 2. Esquema de Distribución Recomendado (80/20 Modificado)

Para evitar la frustración de una fecha donde "nadie cobró nada", se establece un esquema balanceado de **Premios Escalonados**:

### 2.1 Desglose del Pozo de Cada Fecha (80% del Total Recaudado)
Del 80% recaudado destinado a premios:
1. **60% al Pozo Mayor (El Pleno)**:
   - Requiere 100% de aciertos de los partidos válidos (ej. 14/14).
   - Si no hay ganadores con puntaje perfecto: **SE ACUMULA (Pozo Vacante)** para la próxima fecha.
2. **30% al Premio Consuelo Semanal (Mejor Puntaje)**:
   - Se reparte obligatoriamente entre quien o quienes hayan obtenido la mayor cantidad de aciertos en la fecha (aunque hayan sido 10 o 11 aciertos).
   - Garantiza que en todas las fechas haya al menos un ganador festejando y cobrando.
3. **10% al Fondo de Reserva / Pozo Estímulo**:
   - Se guarda en un bote de contingencia para iniciar la temporada siguiente con un pozo inicial garantizado o para premiar al campeón del torneo general.

---

## 3. Ejemplo Práctico de Acumulación (3 Fechas Consecutivas)

Supongamos una entrada fija de $1.000 y 100 jugadores constantes por fecha (Recaudación: $100.000 por fecha; $80.000 para premios).

### Fecha 1
- **Recaudación**: $100.000 ($80.000 pozo total).
- **Pozo Mayor (60%)**: $48.000.
- **Premio Consuelo (30%)**: $24.000.
- **Fondo Reserva (10%)**: $8.000.
- *Resultado*: Máximo acierto de la fecha fue 12/14.
  - El Pozo Mayor ($48.000) queda **VACANTE**.
  - Los $24.000 del Consuelo se dividen entre los dos jugadores con 12 aciertos ($12.000 c/u).

### Fecha 2 (Efecto Pozo Acumulado)
- Gracias a la publicidad del pozo vacante, se suman 150 jugadores ($150.000 recaudación; $120.000 pozo nuevo).
- **Pozo Mayor**: $48.000 (acumulado previo) + $72.000 (nuevo) = **$120.000**.
- **Premio Consuelo**: $36.000.
- *Resultado*: Máximo acierto fue 13/14.
  - El Pozo Mayor vuelve a quedar **VACANTE**.
  - El Consuelo de $36.000 se entrega al jugador solitario con 13 aciertos.

### Fecha 3 (Fiebre de Pozo Récord)
- Participan 250 jugadores ($250.000 recaudación; $200.000 nuevo pozo).
- **Pozo Mayor en juego**: $120.000 (acumulados) + $120.000 (nuevo) = **$240.000**.
- **Premio Consuelo**: $60.000.
- *Resultado*: 1 jugador acierta 14/14.
  - Se lleva el pozo récord de **$240.000**.

---

## 4. Requerimientos de Implementación en Software

### 4.1 Modificaciones en Base de Datos y Tipos
```typescript
interface Round {
  // ... campos existentes
  mode: "clasico" | "quiniela";
  jackpotBroughtForward: number; // Pozo acumulado arrastrado de la fecha anterior
  jackpotCarriedOver: number;    // Pozo que pasa a la fecha siguiente si queda vacante
  perfectScoreRequired: boolean; // Si exige 100% para el pozo mayor
}
```

### 4.2 Ajustes en la Liquidación Automática (`settleRound`)
- Evaluar si `maxHits === totalValidMatches`.
- Si `true`: asignar `Prize` del pozo mayor a los ganadores perfectos.
- Si `false`: crear registro contable de `jackpotCarriedOver` e inyectarlo automáticamente en la próxima fecha abierta o en borrador.

### 4.3 Elementos Visuales en el Frontend
- **Banner Gigante de Pozo Vacante**:
  - *"¡POZO VACANTE ACUMULADO! Esta fecha jugás por un acumulado de $240.000"*.
- **Indicador de requisitos claros**:
  - Medidor de progreso en vivo que indique si algún jugador de la tabla actual sigue con puntaje perfecto a medida que finalizan los partidos de la fecha.
