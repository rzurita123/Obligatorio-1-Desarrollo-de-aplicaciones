const mongoose = require("mongoose");
const { Table, Participant, Item, Payment } = require("../models");
const { signParticipantToken } = require("../utils/jwt.util");
const { appError } = require("../utils/app-error.util");

function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

function randomQrCode() {
  return `QR-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
}

function pickParticipantName(p) {
  return {
    participantId: p._id.toString(),
    userId: p.userId ? p.userId.toString() : null,
    name: p.name,
  };
}

function buildParticipantStats(participants, items, payments) {
  const stats = new Map();

  for (const p of participants) {
    stats.set(p._id.toString(), {
      participantId: p._id.toString(),
      userId: p.userId ? p.userId.toString() : null,
      name: p.name,
      debt: 0,
      paid: 0,
      items: [],
    });
  }

  for (const item of items) {
    for (const line of item.assignments || []) {
      const participantKey = line.participantId.toString();
      const st = stats.get(participantKey);
      if (!st) continue;
      st.debt += Number(line.amount) || 0;
      st.items.push({
        itemId: item._id.toString(),
        title: item.title,
        amount: Number(line.amount) || 0,
      });
    }
  }

  for (const payment of payments) {
    const participantKey = payment.participantId.toString();
    const st = stats.get(participantKey);
    if (!st) continue;
    st.paid += Number(payment.amount) || 0;
  }

  return Array.from(stats.values()).map((p) => ({
    ...p,
    debt: Number(p.debt.toFixed(2)),
    paid: Number(p.paid.toFixed(2)),
  }));
}

async function ensureTable(tableId) {
  if (!isValidObjectId(tableId)) {
    throw appError("tableId inválido", 400, "VALIDATION");
  }
  const table = await Table.findById(tableId);
  if (!table) {
    throw appError("Mesa no encontrada", 404, "NOT_FOUND");
  }
  return table;
}

async function createTable({ label }) {
  const trimmed = String(label).trim();
  try {
    const table = await Table.create({
      label: trimmed,
      qrCode: randomQrCode(),
      status: "OPEN",
    });

    return {
      id: table._id.toString(),
      qrCode: table.qrCode,
      label: table.label,
      status: table.status,
    };
  } catch (err) {
    if (err.code === 11000) {
      throw appError("Ya existe una mesa con ese label", 409, "DUPLICATE_LABEL");
    }
    throw err;
  }
}

async function listTables(query = {}) {
  const page = Number(query.page || 1);
  const limit = Number(query.limit || 50);
  const skip = (page - 1) * limit;

  const filter = {};
  if (query.id) {
    if (!isValidObjectId(query.id)) {
      throw appError("id inválido", 400, "VALIDATION");
    }
    filter._id = query.id;
  }
  if (query.qrCode) {
    filter.qrCode = String(query.qrCode).trim();
  }
  if (query.label) {
    filter.label = String(query.label).trim();
  }

  const [tables, total] = await Promise.all([
    Table.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Table.countDocuments(filter),
  ]);

  const data = tables.map((t) => ({
    id: t._id.toString(),
    qrCode: t.qrCode,
    label: t.label,
    status: t.status,
    createdAt: t.createdAt,
    updatedAt: t.updatedAt,
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

async function getTableByQrCode(qrCode) {
  const table = await Table.findOne({ qrCode: String(qrCode).trim() });
  if (!table) {
    throw appError("Mesa no encontrada para ese QR", 404, "NOT_FOUND");
  }
  return {
    id: table._id.toString(),
    qrCode: table.qrCode,
    label: table.label,
    status: table.status,
  };
}

async function joinTable({ tableId, name, userId = null }) {
  const table = await ensureTable(tableId);
  if (table.status === "CLOSED") {
    throw appError("La mesa ya está cerrada", 409, "TABLE_CLOSED");
  }

  const participant = await Participant.create({
    tableId: table._id,
    userId: userId || null,
    name: String(name).trim(),
  });

  const token = signParticipantToken({ participant, tableId: table._id });

  return {
    participant: pickParticipantName(participant),
    token,
    tokenType: "participant",
    table: {
      id: table._id.toString(),
      status: table.status,
    },
  };
}

async function getSummary(tableId) {
  const table = await ensureTable(tableId);
  const [participants, items, payments] = await Promise.all([
    Participant.find({ tableId: table._id }),
    Item.find({ tableId: table._id }).sort({ createdAt: 1 }),
    Payment.find({ tableId: table._id }).sort({ createdAt: 1 }),
  ]);

  const participantsSummary = buildParticipantStats(participants, items, payments);
  const totalAmount = items.reduce((acc, it) => acc + (Number(it.amount) || 0), 0);
  const totalPaid = payments.reduce((acc, p) => acc + (Number(p.amount) || 0), 0);
  const totalDebt = participantsSummary.reduce((acc, p) => acc + (p.debt - p.paid), 0);

  return {
    tableId: table._id.toString(),
    status: table.status,
    totalAmount: Number(totalAmount.toFixed(2)),
    totalPaid: Number(totalPaid.toFixed(2)),
    remainingDebt: Number(Math.max(totalDebt, 0).toFixed(2)),
    participants: participantsSummary,
    items: items.map((it) => ({
      id: it._id.toString(),
      title: it.title,
      quantity: it.quantity,
      amount: it.amount,
      assignments: (it.assignments || []).map((line) => ({
        participantId: line.participantId.toString(),
        amount: line.amount,
      })),
    })),
    payments: payments.map((p) => ({
      id: p._id.toString(),
      participantId: p.participantId.toString(),
      amount: p.amount,
      clientPaymentId: p.clientPaymentId || null,
      createdAt: p.createdAt,
    })),
  };
}

async function getTableStatus(tableId) {
  const summary = await getSummary(tableId);
  return {
    tableId: summary.tableId,
    status: summary.status,
    remainingDebt: summary.remainingDebt,
  };
}

async function closeTable(tableId) {
  const table = await ensureTable(tableId);
  if (table.status === "CLOSED") {
    return { tableId: table._id.toString(), status: table.status };
  }

  const summary = await getSummary(table._id.toString());
  if (summary.remainingDebt > 0) {
    throw appError("No se puede cerrar: existen deudas pendientes", 409, "DEBT_PENDING");
  }

  table.status = "CLOSED";
  await table.save();

  return { tableId: table._id.toString(), status: table.status };
}

module.exports = {
  ensureTable,
  createTable,
  listTables,
  getTableByQrCode,
  joinTable,
  getSummary,
  getTableStatus,
  closeTable,
};
