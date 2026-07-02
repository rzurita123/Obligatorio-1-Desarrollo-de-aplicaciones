const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
const QRCode = require("qrcode");
const sharp = require("sharp");
const { Table, Participant, Item, Payment } = require("../models");
const { signParticipantToken } = require("../utils/jwt.util");
const { appError } = require("../utils/app-error.util");
const { computeSplitAmounts } = require("./split.service");
const { computeParticipantBalances, buildSummaryTotals } = require("./participant-balance.service");
const { ensureBusinessActive } = require("./business.service");
const { SPLIT_TYPES } = require("../constants/split-type.constant");

const MESA_PAY_QR_OPTIONS = {
  type: "png",
  errorCorrectionLevel: "H",
  margin: 2,
  width: 768,
  color: {
    dark: "#006D5B",
    light: "#EAF7F3",
  },
};

const MESA_PAY_LOGO_PATH = path.resolve(__dirname, "../../assets/logo-mesapay-transparente.png");

function bufferToDataUrl(buffer, mimeType = "image/png") {
  return `data:${mimeType};base64,${buffer.toString("base64")}`;
}

async function composeMesaPayQrWithLogo(qrPngBuffer) {
  if (!fs.existsSync(MESA_PAY_LOGO_PATH)) {
    return qrPngBuffer;
  }

  const qrMeta = await sharp(qrPngBuffer).metadata();
  const qrSize = Math.min(qrMeta.width || 768, qrMeta.height || 768);

  const logoTargetSize = Math.floor(qrSize * 0.2);
  const logoPad = Math.floor(logoTargetSize * 0.25);
  const logoContainerSize = logoTargetSize + logoPad * 2;
  const logoX = Math.floor((qrSize - logoContainerSize) / 2);
  const logoY = Math.floor((qrSize - logoContainerSize) / 2);

  const logoBuffer = await sharp(MESA_PAY_LOGO_PATH)
    .resize(logoTargetSize, logoTargetSize, { fit: "contain" })
    .png()
    .toBuffer();

  const logoBackdrop = await sharp({
    create: {
      width: logoContainerSize,
      height: logoContainerSize,
      channels: 4,
      background: "#0B4F45",
    },
  })
    .png()
    .toBuffer();

  return sharp(qrPngBuffer)
    .composite([
      { input: logoBackdrop, left: logoX, top: logoY },
      { input: logoBuffer, left: logoX + logoPad, top: logoY + logoPad },
    ])
    .png()
    .toBuffer();
}

function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

function randomQrCode() {
  return `QR-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
}

function buildTableQrPayload(table) {
  return JSON.stringify({
    tableId: table._id.toString(),
    qrCode: table.qrCode,
  });
}

function tableTipPayload(table) {
  return {
    tipMode: table.tipMode || "none",
    tipValue: table.tipValue != null ? Number(table.tipValue) : 0,
  };
}

function tableSplitPayload(table) {
  return {
    splitType: table.splitType || null,
    splitConfig: table.splitConfig || null,
    splitAppliedAt: table.splitAppliedAt || null,
  };
}

function pickParticipantName(p) {
  return {
    participantId: p._id.toString(),
    userId: p.userId ? p.userId.toString() : null,
    name: p.name,
  };
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

async function ensureTableOpen(table) {
  if (table.status === "CLOSED") {
    throw appError("La mesa ya está cerrada", 409, "TABLE_CLOSED");
  }
}

async function ensureTableInBusiness(businessId, tableId) {
  const table = await ensureTable(tableId);
  if (String(table.businessId) !== String(businessId)) {
    throw appError("La mesa no pertenece a este negocio", 403, "FORBIDDEN");
  }
  return table;
}

function ensureSplitNotApplied(table) {
  if (table.splitType && table.splitAppliedAt) {
    throw appError("Ya se aplicó un split en esta mesa", 409, "SPLIT_APPLIED");
  }
}

async function loadTableContext(tableId) {
  const table = await ensureTable(tableId);
  const [participants, items, payments] = await Promise.all([
    Participant.find({ tableId: table._id }),
    Item.find({ tableId: table._id }).sort({ createdAt: 1 }),
    Payment.find({ tableId: table._id }).sort({ createdAt: 1 }),
  ]);
  return { table, participants, items, payments };
}

async function createTable({ businessId, label }) {
  await ensureBusinessActive(businessId);
  const trimmed = String(label).trim();
  try {
    const table = await Table.create({
      businessId,
      label: trimmed,
      qrCode: randomQrCode(),
      status: "OPEN",
    });

    return {
      id: table._id.toString(),
      businessId: table.businessId.toString(),
      qrCode: table.qrCode,
      label: table.label,
      status: table.status,
      ...tableTipPayload(table),
      ...tableSplitPayload(table),
    };
  } catch (err) {
    if (err.code === 11000) {
      throw appError("Ya existe una mesa con ese label o código QR en este negocio", 409, "DUPLICATE_LABEL");
    }
    throw err;
  }
}

async function listTables(businessId, query = {}) {
  await ensureBusinessActive(businessId);
  const page = Number(query.page || 1);
  const limit = Number(query.limit || 50);
  const skip = (page - 1) * limit;

  const filter = { businessId };
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
    businessId: t.businessId.toString(),
    qrCode: t.qrCode,
    label: t.label,
    status: t.status,
    ...tableTipPayload(t),
    ...tableSplitPayload(t),
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

async function getTableByQrCode(businessId, qrCode) {
  await ensureBusinessActive(businessId);
  const table = await Table.findOne({
    businessId,
    qrCode: String(qrCode).trim(),
  });
  if (!table) {
    throw appError("Mesa no encontrada para ese QR", 404, "NOT_FOUND");
  }
  return {
    id: table._id.toString(),
    businessId: table.businessId.toString(),
    qrCode: table.qrCode,
    label: table.label,
    status: table.status,
    ...tableTipPayload(table),
    ...tableSplitPayload(table),
  };
}

async function getTableById(businessId, tableId) {
  const table = await ensureTableInBusiness(businessId, tableId);
  return {
    id: table._id.toString(),
    businessId: table.businessId.toString(),
    qrCode: table.qrCode,
    label: table.label,
    status: table.status,
    ...tableTipPayload(table),
    ...tableSplitPayload(table),
    createdAt: table.createdAt,
    updatedAt: table.updatedAt,
  };
}

async function getTableQrImage(businessId, tableId) {
  const table = await ensureTableInBusiness(businessId, tableId);
  const payload = buildTableQrPayload(table);
  const baseQrPngBuffer = await QRCode.toBuffer(payload, MESA_PAY_QR_OPTIONS);
  const qrPngBuffer = await composeMesaPayQrWithLogo(baseQrPngBuffer);
  const qrImageDataUrl = bufferToDataUrl(qrPngBuffer);

  return {
    tableId: table._id.toString(),
    qrCode: table.qrCode,
    qrImageDataUrl,
  };
}

async function getTableQrPngBuffer(businessId, tableId) {
  const table = await ensureTableInBusiness(businessId, tableId);
  const payload = buildTableQrPayload(table);
  const baseQrPngBuffer = await QRCode.toBuffer(payload, MESA_PAY_QR_OPTIONS);
  const qrPngBuffer = await composeMesaPayQrWithLogo(baseQrPngBuffer);

  return {
    tableId: table._id.toString(),
    qrCode: table.qrCode,
    qrPngBuffer,
  };
}

function formatTableResponse(table) {
  return {
    id: table._id.toString(),
    businessId: table.businessId.toString(),
    qrCode: table.qrCode,
    label: table.label,
    status: table.status,
    ...tableTipPayload(table),
    ...tableSplitPayload(table),
    createdAt: table.createdAt,
    updatedAt: table.updatedAt,
  };
}

async function updateTable(businessId, tableId, body = {}) {
  const table = await ensureTableInBusiness(businessId, tableId);
  await ensureTableOpen(table);

  if (table.splitType && table.splitAppliedAt && (body.tipMode != null || body.tipValue != null)) {
    throw appError("No se puede cambiar la propina con un split aplicado", 409, "SPLIT_APPLIED");
  }

  let changed = false;
  if (body.label != null) {
    const trimmed = String(body.label).trim();
    if (table.label !== trimmed) {
      table.label = trimmed;
      changed = true;
    }
  }

  if (body.tipMode != null) {
    table.tipMode = body.tipMode;
    if (body.tipMode === "none") {
      table.tipValue = 0;
    }
    changed = true;
  }
  if (body.tipValue != null) {
    table.tipValue = Number(body.tipValue);
    changed = true;
  }

  if (table.tipMode === "percent" && (table.tipValue < 0 || table.tipValue > 100)) {
    throw appError("tipValue para modo percent debe estar entre 0 y 100", 400, "VALIDATION");
  }

  if (!changed) {
    return formatTableResponse(table);
  }

  try {
    await table.save();
  } catch (err) {
    if (err.code === 11000) {
      throw appError("Ya existe una mesa con ese label en este negocio", 409, "DUPLICATE_LABEL");
    }
    throw err;
  }
  return formatTableResponse(table);
}

async function deleteTable(businessId, tableId) {
  await ensureTableInBusiness(businessId, tableId);
  const tid = new mongoose.Types.ObjectId(tableId);
  await Promise.all([
    Payment.deleteMany({ tableId: tid }),
    Item.deleteMany({ tableId: tid }),
    Participant.deleteMany({ tableId: tid }),
  ]);
  await Table.deleteOne({ _id: tid });
  return { id: tableId, deleted: true };
}

async function joinTable({ tableId, name, userId = null }) {
  const table = await ensureTable(tableId);
  await ensureBusinessActive(table.businessId);
  await ensureTableOpen(table);
  if (table.splitType && table.splitAppliedAt) {
    throw appError("No se puede unir a una mesa con split ya aplicado", 409, "SPLIT_APPLIED");
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
    linkedUser: Boolean(participant.userId),
    userId: participant.userId ? participant.userId.toString() : null,
    table: {
      id: table._id.toString(),
      businessId: table.businessId.toString(),
      status: table.status,
    },
  };
}

function formatSummary(table, participants, items, payments) {
  const participantBalances = computeParticipantBalances({ table, participants, items, payments });
  const totals = buildSummaryTotals(table, items, payments, participantBalances);

  return {
    tableId: table._id.toString(),
    businessId: table.businessId.toString(),
    status: table.status,
    ...tableTipPayload(table),
    ...tableSplitPayload(table),
    ...totals,
    totalAmount: totals.subtotal,
    participants: participantBalances,
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

async function getSummary(tableId) {
  const { table, participants, items, payments } = await loadTableContext(tableId);
  return formatSummary(table, participants, items, payments);
}

async function getTableStatus(tableId) {
  const summary = await getSummary(tableId);
  return {
    tableId: summary.tableId,
    businessId: summary.businessId,
    status: summary.status,
    splitType: summary.splitType,
    subtotal: summary.subtotal,
    tipAmount: summary.tipAmount,
    grandTotal: summary.grandTotal,
    remainingDebt: summary.remainingDebt,
  };
}

async function applyTableSplit(tableId, body) {
  const { table, participants, items, payments } = await loadTableContext(tableId);
  await ensureTableOpen(table);

  if (payments.length > 0) {
    throw appError("No se puede cambiar el split después de registrar pagos", 409, "PAYMENTS_EXIST");
  }

  const type = body.type;
  if (!Object.values(SPLIT_TYPES).includes(type)) {
    throw appError("Tipo de split inválido", 400, "VALIDATION");
  }

  const result = computeSplitAmounts(type, {
    participants,
    items,
    table,
    shares: body.shares,
    amounts: body.amounts,
  });

  table.splitType = type;
  table.splitConfig = result.splitConfig;
  table.splitAppliedAt = new Date();
  await table.save();

  await Promise.all(
    result.participants.map((p) =>
      Participant.updateOne({ _id: p.participantId }, { amountDue: p.amountDue })
    )
  );

  const updatedParticipants = await Participant.find({ tableId: table._id });
  const summary = formatSummary(table, updatedParticipants, items, payments);

  return {
    ...summary,
    warnings: result.warnings,
  };
}

async function resetTableSplit(businessId, tableId) {
  const table = await ensureTableInBusiness(businessId, tableId);
  await ensureTableOpen(table);

  const payments = await Payment.find({ tableId: table._id });
  if (payments.length > 0) {
    throw appError("No se puede resetear el split con pagos registrados", 409, "PAYMENTS_EXIST");
  }

  table.splitType = null;
  table.splitConfig = null;
  table.splitAppliedAt = null;
  await table.save();

  await Participant.updateMany({ tableId: table._id }, { amountDue: null });

  return { tableId: table._id.toString(), splitReset: true };
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

async function closeTableIfFullyPaid(table) {
  const summary = await getSummary(table._id.toString());
  if (summary.remainingDebt === 0 && table.status !== "CLOSED") {
    table.status = "CLOSED";
    await table.save();
    return true;
  }
  return false;
}

module.exports = {
  ensureTable,
  ensureTableOpen,
  ensureTableInBusiness,
  ensureSplitNotApplied,
  createTable,
  listTables,
  getTableByQrCode,
  getTableById,
  getTableQrImage,
  getTableQrPngBuffer,
  updateTable,
  deleteTable,
  joinTable,
  getSummary,
  getTableStatus,
  applyTableSplit,
  resetTableSplit,
  closeTable,
  closeTableIfFullyPaid,
  loadTableContext,
  formatSummary,
};
