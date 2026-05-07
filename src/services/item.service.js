const { Item, Participant } = require("../models");
const { appError } = require("../utils/app-error.util");
const { ensureTable } = require("./table.service");

async function createItem({ tableId, title, quantity, amount }) {
  const table = await ensureTable(tableId);
  if (table.status === "CLOSED") {
    throw appError("No se pueden agregar ítems a una mesa cerrada", 409, "TABLE_CLOSED");
  }

  const item = await Item.create({
    tableId: table._id,
    title: String(title).trim(),
    quantity,
    amount,
    assignments: [],
  });

  return {
    id: item._id.toString(),
    tableId: item.tableId.toString(),
    title: item.title,
    quantity: item.quantity,
    amount: item.amount,
    assignments: [],
  };
}

async function assignItem({ itemId, participantTableId, assignments }) {
  const item = await Item.findById(itemId);
  if (!item) {
    throw appError("Ítem no encontrado", 404, "NOT_FOUND");
  }
  if (String(item.tableId) !== String(participantTableId)) {
    throw appError("El ítem no pertenece a la mesa del token", 403, "FORBIDDEN");
  }

  const table = await ensureTable(item.tableId.toString());
  if (table.status === "CLOSED") {
    throw appError("No se puede asignar en una mesa cerrada", 409, "TABLE_CLOSED");
  }

  const participantIds = assignments.map((a) => a.participantId);
  const participants = await Participant.find({
    _id: { $in: participantIds },
    tableId: item.tableId,
  });

  if (participants.length !== participantIds.length) {
    throw appError("Hay participantes inexistentes o fuera de la mesa", 400, "VALIDATION");
  }

  const totalAssigned = assignments.reduce((acc, a) => acc + Number(a.amount || 0), 0);
  if (Number(totalAssigned.toFixed(2)) !== Number(item.amount.toFixed(2))) {
    throw appError("La suma de asignaciones debe coincidir con el monto del ítem", 400, "VALIDATION");
  }

  item.assignments = assignments.map((a) => ({
    participantId: a.participantId,
    amount: Number(a.amount),
  }));
  await item.save();

  return {
    id: item._id.toString(),
    tableId: item.tableId.toString(),
    title: item.title,
    amount: item.amount,
    assignments: item.assignments.map((a) => ({
      participantId: a.participantId.toString(),
      amount: a.amount,
    })),
  };
}

async function listItemsByTable(tableId, query = {}) {
  await ensureTable(tableId);

  const page = Number(query.page || 1);
  const limit = Number(query.limit || 10);
  const skip = (page - 1) * limit;

  const filters = { tableId };
  if (query.assigned === true) {
    filters["assignments.0"] = { $exists: true };
  } else if (query.assigned === false) {
    filters.assignments = { $size: 0 };
  }
  if (query.search) {
    filters.title = { $regex: query.search, $options: "i" };
  }

  const [items, total] = await Promise.all([
    Item.find(filters).sort({ createdAt: 1 }).skip(skip).limit(limit).lean(),
    Item.countDocuments(filters),
  ]);

  const data = items.map((it) => ({
    id: it._id.toString(),
    tableId: it.tableId.toString(),
    title: it.title,
    quantity: it.quantity,
    amount: it.amount,
    assignments: (it.assignments || []).map((a) => ({
      participantId: a.participantId.toString(),
      amount: a.amount,
    })),
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

module.exports = {
  createItem,
  assignItem,
  listItemsByTable,
};
