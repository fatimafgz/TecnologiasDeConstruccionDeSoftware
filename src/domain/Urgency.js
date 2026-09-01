/**
 * CAPA DE DOMINIO — Value Object: Urgencia de caducidad.
 * Reglas puras del negocio: no conoce HTTP, ni SQL, ni la UI.
 *
 *   VERDE    Fresco            > 5 dias restantes
 *   AMARILLO Consumir pronto   2 a 4 dias
 *   ROJO     Urgente / riesgo  <= 1 dia (24-48 h) o vencido
 */
export const UrgencyLevel = Object.freeze({
  FRESH: 'FRESH',
  SOON: 'SOON',
  URGENT: 'URGENT',
  EXPIRED: 'EXPIRED',
});

/** Peso numerico de cada nivel: alimenta el Matching Score. */
export const URGENCY_WEIGHT = Object.freeze({
  [UrgencyLevel.EXPIRED]: 6,
  [UrgencyLevel.URGENT]: 5,
  [UrgencyLevel.SOON]: 2.5,
  [UrgencyLevel.FRESH]: 1,
});

export const URGENCY_UI = Object.freeze({
  [UrgencyLevel.FRESH]:   { dot: '🟢', label: 'Fresco',           tone: 'fresh' },
  [UrgencyLevel.SOON]:    { dot: '🟡', label: 'Consumir pronto',  tone: 'soon' },
  [UrgencyLevel.URGENT]:  { dot: '🔴', label: '¡Urgente!',        tone: 'urgent' },
  [UrgencyLevel.EXPIRED]: { dot: '🔴', label: 'Vencido',          tone: 'expired' },
});

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** Normaliza una fecha a medianoche UTC para contar dias calendario completos. */
function startOfDay(date) {
  const d = new Date(date);
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}

/** Dias calendario restantes hasta la caducidad (negativo = ya vencio). */
export function daysUntil(expiryDate, now = new Date()) {
  return Math.round((startOfDay(expiryDate) - startOfDay(now)) / MS_PER_DAY);
}

export function levelForDays(days) {
  if (days < 0) return UrgencyLevel.EXPIRED;
  if (days <= 1) return UrgencyLevel.URGENT;
  if (days <= 4) return UrgencyLevel.SOON;
  return UrgencyLevel.FRESH;
}

/** True para lo que el recomendador considera "a punto de vencer". */
export function isAtRisk(level) {
  return level === UrgencyLevel.URGENT || level === UrgencyLevel.EXPIRED;
}
