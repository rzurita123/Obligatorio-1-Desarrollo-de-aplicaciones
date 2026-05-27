const { appError } = require("../utils/app-error.util");

const WARNING_ZERO_CONSUMPTION = {
  code: "PARTICIPANT_ZERO_CONSUMPTION",
  message:
    "Hay participantes sin consumo asignado; no tiene sentido que se hayan sumado a la mesa para este reparto.",
};

function toCents(n) {
  return Math.round(Number(n) * 100);
}

function fromCents(c) {
  return Number((c / 100).toFixed(2));
}

/** Reparte `totalCents` en partes iguales entre `count` personas (centavos exactos). */
function splitEqualCents(totalCents, count) {
  if (count <= 0) return [];
  const base = Math.floor(totalCents / count);
  let rem = totalCents - base * count;
  const out = new Array(count).fill(base);
  for (let i = 0; i < count && rem > 0; i++) {
    out[i] += 1;
    rem -= 1;
  }
  return out;
}

/** Reparte `totalCents` proporcional a pesos enteros >= 0; si suma 0 devuelve ceros. */
function splitProportionalCents(totalCents, weights) {
  const sumW = weights.reduce((a, w) => a + w, 0);
  if (sumW <= 0 || totalCents <= 0) {
    return weights.map(() => 0);
  }
  const n = weights.length;
  const raw = weights.map((w) => (totalCents * w) / sumW);
  const floors = raw.map((x) => Math.floor(x));
  let rem = totalCents - floors.reduce((a, b) => a + b, 0);
  const fracIdx = raw
    .map((x, i) => ({ i, f: x - floors[i] }))
    .sort((a, b) => b.f - a.f);
  const out = [...floors];
  let k = 0;
  while (rem > 0 && k < n) {
    out[fracIdx[k].i] += 1;
    rem -= 1;
    k += 1;
  }
  return out;
}

/**
 * @param {"equal"|"byItems"} type
 * @param {object} params
 * @param {boolean} params.unassignedItems
 * @param {Array<{participantId:string,name:string,debt:number}>} params.participants
 * @param {number} params.subtotal
 * @param {number} params.tipAmount
 * @param {number} params.grandTotal
 */
function computeTableSplit(type, { unassignedItems, participants, subtotal, tipAmount, grandTotal }) {
  if (!participants.length) {
    throw appError("No hay participantes para dividir", 400, "VALIDATION");
  }

  if (type === "byItems" && unassignedItems) {
    throw appError("Hay ítems sin repartir; asigná todos los consumos antes de usar split por ítems", 400, "UNASSIGNED_ITEMS");
  }

  const tipCents = toCents(tipAmount);
  const subtotalCents = toCents(subtotal);
  const grandCents = toCents(grandTotal);

  const debts = participants.map((p) => toCents(p.debt));
  const consumerIdx = participants.map((_, i) => i).filter((i) => debts[i] > 0);

  if (tipCents > 0 && consumerIdx.length === 0) {
    throw appError("No hay consumo asignado para repartir la propina", 400, "NO_CONSUMERS_FOR_TIP");
  }

  const warnings = [];
  if (participants.some((p) => toCents(p.debt) <= 0)) {
    warnings.push({ ...WARNING_ZERO_CONSUMPTION });
  }

  const n = participants.length;
  const subEqualParts = splitEqualCents(subtotalCents, n);

  const weightForTip = debts.map((d) => (d > 0 ? d : 0));
  const tipParts = splitProportionalCents(tipCents, weightForTip);

  const suggestedCents = new Array(n).fill(0);

  if (type === "equal") {
    for (let i = 0; i < n; i++) {
      suggestedCents[i] = subEqualParts[i] + tipParts[i];
    }
  } else {
    for (let i = 0; i < n; i++) {
      suggestedCents[i] = debts[i] + tipParts[i];
    }
  }

  const sumSuggested = suggestedCents.reduce((a, b) => a + b, 0);
  let drift = grandCents - sumSuggested;
  for (let i = n - 1; drift !== 0 && i >= 0; i--) {
    const adj = drift > 0 ? 1 : suggestedCents[i] > 0 ? -1 : 0;
    if (adj === 0) continue;
    suggestedCents[i] += adj;
    drift -= adj;
  }

  const participantsOut = participants.map((p, i) => ({
    participantId: p.participantId,
    name: p.name,
    debt: Number(p.debt.toFixed(2)),
    suggestedAmount: fromCents(suggestedCents[i]),
  }));

  return {
    splitType: type,
    subtotal: Number(subtotal.toFixed(2)),
    tipAmount: Number(tipAmount.toFixed(2)),
    grandTotal: Number(grandTotal.toFixed(2)),
    participants: participantsOut,
    warnings,
  };
}

module.exports = {
  computeTableSplit,
  computeTipAmount(table, subtotal) {
    const mode = table.tipMode || "none";
    const val = Number(table.tipValue) || 0;
    if (mode === "none") return 0;
    if (mode === "percent") {
      return Number(((Number(subtotal) * val) / 100).toFixed(2));
    }
    if (mode === "fixed") {
      return Number(Math.max(0, val).toFixed(2));
    }
    return 0;
  },
};
