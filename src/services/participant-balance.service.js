const { computeConsumptionMap, computeTipAmount } = require("./split.service");

function round2(n) {
  return Number(Number(n).toFixed(2));
}

/**
 * Calcula balances por participante incluyendo propina cuando hay split aplicado.
 */
function computeParticipantBalances({ table, participants, items, payments }) {
  const consumptionMap = computeConsumptionMap(participants, items);
  const paidMap = new Map();

  for (const p of participants) {
    paidMap.set(p._id.toString(), 0);
  }
  for (const payment of payments) {
    const key = payment.participantId.toString();
    if (paidMap.has(key)) {
      paidMap.set(key, paidMap.get(key) + (Number(payment.amount) || 0));
    }
  }

  const splitApplied = Boolean(table.splitType && table.splitAppliedAt);

  return participants.map((p) => {
    const key = p._id.toString();
    const entry = consumptionMap.get(key) || { consumption: 0, items: [] };
    const consumption = round2(entry.consumption);
    const paid = round2(paidMap.get(key) || 0);

    let tipShare = 0;
    let amountDue = consumption;

    if (splitApplied && p.amountDue != null) {
      amountDue = round2(p.amountDue);
      tipShare = round2(amountDue - consumption);
    } else if (!splitApplied) {
      tipShare = 0;
      amountDue = consumption;
    }

    const remaining = round2(Math.max(0, amountDue - paid));

    return {
      participantId: key,
      userId: p.userId ? p.userId.toString() : null,
      name: p.name,
      consumption,
      tipShare,
      amountDue,
      paid,
      remaining,
      debt: amountDue,
      items: entry.items,
    };
  });
}

function buildSummaryTotals(table, items, payments, participantBalances) {
  const subtotal = round2(items.reduce((acc, it) => acc + (Number(it.amount) || 0), 0));
  const tipAmount = computeTipAmount(table, subtotal);
  const grandTotal = round2(subtotal + tipAmount);
  const totalPaid = round2(payments.reduce((acc, p) => acc + (Number(p.amount) || 0), 0));
  const remainingDebt = round2(
    participantBalances.reduce((acc, p) => acc + p.remaining, 0)
  );
  const unassignedItems = items.some((it) => !it.assignments || it.assignments.length === 0);

  return {
    subtotal,
    tipAmount,
    grandTotal,
    totalPaid,
    remainingDebt,
    unassignedItems,
  };
}

module.exports = {
  computeParticipantBalances,
  buildSummaryTotals,
};
