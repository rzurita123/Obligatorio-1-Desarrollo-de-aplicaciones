const mongoose = require("mongoose");
const { Participant, Item } = require("../models");
const { appError } = require("../utils/app-error.util");
const {
  ensureTable,
  ensureTableInBusiness,
  ensureTableOpen,
  loadTableContext,
} = require("./table.service");
const { computeParticipantBalances } = require("./participant-balance.service");

function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

async function getParticipantRemaining(tableId, participantId) {
  const { table, participants, items, payments } = await loadTableContext(tableId);
  const balances = computeParticipantBalances({ table, participants, items, payments });
  const balance = balances.find((p) => p.participantId === String(participantId));
  if (!balance) {
    throw appError("Participante no encontrado en la mesa", 404, "NOT_FOUND");
  }
  return balance.remaining;
}

async function clearParticipantAssignments(tableId, participantId) {
  const items = await Item.find({ tableId });
  for (const item of items) {
    const had = (item.assignments || []).some(
      (a) => String(a.participantId) === String(participantId)
    );
    if (!had) continue;
    item.assignments = (item.assignments || []).filter(
      (a) => String(a.participantId) !== String(participantId)
    );
    await item.save();
  }
}

async function removeParticipantFromTable({ tableId, participantId }) {
  if (!isValidObjectId(participantId)) {
    throw appError("participantId inválido", 400, "VALIDATION");
  }

  const table = await ensureTable(tableId);
  await ensureTableOpen(table);

  const participant = await Participant.findOne({ _id: participantId, tableId: table._id });
  if (!participant) {
    throw appError("Participante no encontrado en la mesa", 404, "NOT_FOUND");
  }

  const remaining = await getParticipantRemaining(tableId, participantId);
  if (remaining > 0) {
    throw appError("No se puede salir con deuda pendiente", 409, "DEBT_PENDING");
  }

  await clearParticipantAssignments(table._id, participantId);
  await Participant.deleteOne({ _id: participant._id });

  return {
    tableId: table._id.toString(),
    participantId: participant._id.toString(),
    removed: true,
  };
}

async function leaveTable({ tableId, participantId }) {
  return removeParticipantFromTable({ tableId, participantId });
}

async function expelParticipant({ businessId, tableId, participantId }) {
  await ensureTableInBusiness(businessId, tableId);
  return removeParticipantFromTable({ tableId, participantId });
}

module.exports = {
  leaveTable,
  expelParticipant,
  getParticipantRemaining,
};
