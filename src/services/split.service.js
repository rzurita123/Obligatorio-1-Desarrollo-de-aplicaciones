const { appError } = require("../utils/app-error.util");
const { SPLIT_TYPES } = require("../constants/split-type.constant");

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

function fixDrift(amountsCents, targetCents) {
  const out = [...amountsCents];
  let drift = targetCents - out.reduce((a, b) => a + b, 0);
  for (let i = out.length - 1; drift !== 0 && i >= 0; i--) {
    const adj = drift > 0 ? 1 : out[i] > 0 ? -1 : 0;
    if (adj === 0) continue;
    out[i] += adj;
    drift -= adj;
  }
  return out;
}

function computeConsumptionMap(participants, items) {
  const map = new Map();
  for (const p of participants) {
    map.set(p._id.toString(), { consumption: 0, items: [] });
  }
  for (const item of items) {
    for (const line of item.assignments || []) {
      const key = line.participantId.toString();
      const entry = map.get(key);
      if (!entry) continue;
      const amt = Number(line.amount) || 0;
      entry.consumption += amt;
      entry.items.push({
        itemId: item._id.toString(),
        title: item.title,
        amount: amt,
      });
    }
  }
  return map;
}

function computeTipAmount(table, subtotal) {
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
}

/**
 * Calcula amountDue por participante según tipo de split (sin persistir).
 * @returns {{ participants: Array, splitConfig: object|null, warnings: Array, subtotal, tipAmount, grandTotal }}
 */
function computeSplitAmounts(type, { participants, items, table, shares, amounts }) {
  if (!participants.length) {
    throw appError("No hay participantes para dividir", 400, "VALIDATION");
  }

  const consumptionMap = computeConsumptionMap(participants, items);
  const subtotal = items.reduce((acc, it) => acc + (Number(it.amount) || 0), 0);
  const tipAmount = computeTipAmount(table, subtotal);
  const grandTotal = Number((subtotal + tipAmount).toFixed(2));
  const grandCents = toCents(grandTotal);
  const tipCents = toCents(tipAmount);
  const unassignedItems = items.some((it) => !it.assignments || it.assignments.length === 0);

  const warnings = [];
  const n = participants.length;
  const consumptions = participants.map((p) => toCents(consumptionMap.get(p._id.toString())?.consumption || 0));
  const amountDueCents = new Array(n).fill(0);
  let splitConfig = null;

  if (type === SPLIT_TYPES.BY_ITEMS) {
    if (unassignedItems) {
      throw appError(
        "Hay ítems sin repartir; asigná todos los consumos antes de usar split por ítems",
        400,
        "UNASSIGNED_ITEMS"
      );
    }
    const consumerIdx = consumptions.map((c, i) => (c > 0 ? i : -1)).filter((i) => i >= 0);
    if (tipCents > 0 && consumerIdx.length === 0) {
      throw appError("No hay consumo asignado para repartir la propina", 400, "NO_CONSUMERS_FOR_TIP");
    }
    if (consumptions.some((c) => c <= 0)) {
      warnings.push({ ...WARNING_ZERO_CONSUMPTION });
    }
    const tipParts = splitProportionalCents(
      tipCents,
      consumptions.map((c) => (c > 0 ? c : 0))
    );
    for (let i = 0; i < n; i++) {
      amountDueCents[i] = consumptions[i] + tipParts[i];
    }
  } else if (type === SPLIT_TYPES.EQUAL) {
    const parts = splitEqualCents(grandCents, n);
    for (let i = 0; i < n; i++) amountDueCents[i] = parts[i];
  } else if (type === SPLIT_TYPES.PERCENTUAL) {
    if (!shares || !shares.length) {
      throw appError("shares requerido para split percentual", 400, "VALIDATION");
    }
    const shareMap = new Map(shares.map((s) => [String(s.participantId), Number(s.percent)]));
    const percents = participants.map((p) => {
      const pct = shareMap.get(p._id.toString());
      if (pct == null) {
        throw appError("Falta percent para un participante", 400, "VALIDATION");
      }
      return pct;
    });
    const sumPct = percents.reduce((a, b) => a + b, 0);
    if (Math.abs(sumPct - 100) > 0.01) {
      throw appError("Los porcentajes deben sumar 100", 400, "VALIDATION");
    }
    splitConfig = { shares: shares.map((s) => ({ participantId: String(s.participantId), percent: Number(s.percent) })) };
    const weights = percents.map((p) => toCents(p));
    const parts = splitProportionalCents(grandCents, weights);
    for (let i = 0; i < n; i++) amountDueCents[i] = parts[i];
  } else if (type === SPLIT_TYPES.CUSTOM) {
    if (!amounts || !amounts.length) {
      throw appError("amounts requerido para split personalizado", 400, "VALIDATION");
    }
    const amountMap = new Map(amounts.map((a) => [String(a.participantId), Number(a.amount)]));
    for (let i = 0; i < n; i++) {
      const amt = amountMap.get(participants[i]._id.toString());
      if (amt == null) {
        throw appError("Falta amount para un participante", 400, "VALIDATION");
      }
      amountDueCents[i] = toCents(amt);
    }
    const sumCustom = amountDueCents.reduce((a, b) => a + b, 0);
    if (sumCustom !== grandCents) {
      throw appError(`Los montos deben sumar ${grandTotal} (grandTotal)`, 400, "VALIDATION");
    }
    splitConfig = {
      amounts: amounts.map((a) => ({ participantId: String(a.participantId), amount: Number(a.amount) })),
    };
  } else {
    throw appError("Tipo de split inválido", 400, "VALIDATION");
  }

  const fixed = fixDrift(amountDueCents, grandCents);

  const participantsOut = participants.map((p, i) => {
    const key = p._id.toString();
    const consumption = fromCents(consumptions[i]);
    const amountDue = fromCents(fixed[i]);
    const tipShare = Number((amountDue - consumption).toFixed(2));
    const entry = consumptionMap.get(key);
    return {
      participantId: key,
      userId: p.userId ? p.userId.toString() : null,
      name: p.name,
      consumption,
      tipShare,
      amountDue,
      items: entry?.items || [],
    };
  });

  return {
    splitType: type,
    splitConfig,
    subtotal: Number(subtotal.toFixed(2)),
    tipAmount: Number(tipAmount.toFixed(2)),
    grandTotal,
    unassignedItems,
    participants: participantsOut,
    warnings,
  };
}

function computeTableSplit(type, params) {
  return computeSplitAmounts(type, {
    participants: params.participants.map((p) => ({
      _id: p.participantId,
      userId: p.userId,
      name: p.name,
    })),
    items: params.items || [],
    table: params.table || { tipMode: "none", tipValue: 0 },
    shares: params.shares,
    amounts: params.amounts,
  });
}

module.exports = {
  computeTableSplit,
  computeSplitAmounts,
  computeTipAmount,
  computeConsumptionMap,
  SPLIT_TYPES,
};
