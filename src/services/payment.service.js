const { Payment, Participant, Table } = require("../models");
const { appError } = require("../utils/app-error.util");
const { getSummary, closeTableIfFullyPaid, ensureTableOpen } = require("./table.service");
const { accruePointsFromPayment } = require("./loyalty.service");

async function listPaymentsByTable(tableId, query = {}) {
  const page = Number(query.page || 1);
  const limit = Number(query.limit || 10);
  const skip = (page - 1) * limit;

  const filters = { tableId };
  if (query.participantId) {
    filters.participantId = query.participantId;
  }
  if (query.from || query.to) {
    filters.createdAt = {};
    if (query.from) {
      filters.createdAt.$gte = new Date(query.from);
    }
    if (query.to) {
      filters.createdAt.$lte = new Date(query.to);
    }
  }

  const [payments, total] = await Promise.all([
    Payment.find(filters).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Payment.countDocuments(filters),
  ]);

  const data = payments.map((p) => ({
    id: p._id.toString(),
    tableId: p.tableId.toString(),
    participantId: p.participantId.toString(),
    amount: p.amount,
    clientPaymentId: p.clientPaymentId || null,
    status: p.status,
    createdAt: p.createdAt,
  }));

  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
}

async function createPayment({ tableId, participantId, amount, clientPaymentId }) {
  if (clientPaymentId) {
    const existing = await Payment.findOne({
      tableId,
      clientPaymentId: String(clientPaymentId).trim(),
    });
    if (existing) {
      return {
        payment: {
          id: existing._id.toString(),
          tableId: existing.tableId.toString(),
          participantId: existing.participantId.toString(),
          amount: existing.amount,
          clientPaymentId: existing.clientPaymentId,
          status: existing.status,
          createdAt: existing.createdAt,
        },
        idempotentReplay: true,
      };
    }
  }

  const participant = await Participant.findById(participantId);
  if (!participant || String(participant.tableId) !== String(tableId)) {
    throw appError("Participante inválido para esa mesa", 403, "FORBIDDEN");
  }

  const table = await Table.findById(tableId);
  if (!table) {
    throw appError("Mesa no encontrada", 404, "NOT_FOUND");
  }
  await ensureTableOpen(table);

  if (!table.splitType || !table.splitAppliedAt) {
    throw appError("Debe aplicarse un split antes de pagar", 403, "SPLIT_NOT_APPLIED");
  }

  const summary = await getSummary(tableId);
  const participantSummary = summary.participants.find(
    (p) => p.participantId === String(participantId)
  );
  if (!participantSummary) {
    throw appError("Participante no encontrado en la mesa", 404, "NOT_FOUND");
  }

  const remaining = participantSummary.remaining;
  if (amount > remaining) {
    throw appError("No se puede pagar más de lo adeudado", 400, "VALIDATION");
  }

  const payment = await Payment.create({
    tableId,
    participantId,
    amount,
    clientPaymentId: clientPaymentId ? String(clientPaymentId).trim() : undefined,
    status: "COMPLETED",
  });

  if (participant.userId) {
    await accruePointsFromPayment({
      userId: participant.userId.toString(),
      paymentId: payment._id.toString(),
      amount: payment.amount,
    });
  }

  await closeTableIfFullyPaid(table);

  return {
    payment: {
      id: payment._id.toString(),
      tableId: payment.tableId.toString(),
      participantId: payment.participantId.toString(),
      amount: payment.amount,
      clientPaymentId: payment.clientPaymentId || null,
      status: payment.status,
      createdAt: payment.createdAt,
    },
    idempotentReplay: false,
  };
}

module.exports = {
  listPaymentsByTable,
  createPayment,
};
