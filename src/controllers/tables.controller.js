const {
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
} = require("../services/table.service");
const { listItemsByTable, splitItemEvenAmong } = require("../services/item.service");
const { listPaymentsByTable } = require("../services/payment.service");
const { leaveTable, expelParticipant } = require("../services/participant.service");
const { sendSuccess } = require("../utils/response.util");
const { appError } = require("../utils/app-error.util");

async function postTable(req, res, next) {
  try {
    const table = await createTable({
      businessId: req.businessId,
      label: req.body.label,
    });
    return sendSuccess(res, 201, table);
  } catch (err) {
    return next(err);
  }
}

async function getTablesList(req, res, next) {
  try {
    const result = await listTables(req.businessId, req.query);
    return sendSuccess(res, 200, { tables: result.data }, { pagination: result.pagination });
  } catch (err) {
    return next(err);
  }
}

async function getTableByQr(req, res, next) {
  try {
    const table = await getTableByQrCode(req.query.businessId, req.params.qrCode);
    return sendSuccess(res, 200, table);
  } catch (err) {
    return next(err);
  }
}

async function getOneTable(req, res, next) {
  try {
    const table = await getTableById(req.businessId, req.params.id);
    return sendSuccess(res, 200, table);
  } catch (err) {
    return next(err);
  }
}

async function getOneTableQrImage(req, res, next) {
  try {
    const payload = await getTableQrImage(req.businessId, req.params.id);
    return sendSuccess(res, 200, payload);
  } catch (err) {
    return next(err);
  }
}

async function getOneTableQrPng(req, res, next) {
  try {
    const payload = await getTableQrPngBuffer(req.businessId, req.params.id);
    res.setHeader("Content-Type", "image/png");
    res.setHeader("Cache-Control", "private, max-age=60");
    return res.status(200).send(payload.qrPngBuffer);
  } catch (err) {
    return next(err);
  }
}

async function patchTable(req, res, next) {
  try {
    const table = await updateTable(req.businessId, req.params.id, req.body || {});
    return sendSuccess(res, 200, table);
  } catch (err) {
    return next(err);
  }
}

async function deleteOneTable(req, res, next) {
  try {
    const result = await deleteTable(req.businessId, req.params.id);
    return sendSuccess(res, 200, result);
  } catch (err) {
    return next(err);
  }
}

async function postTableParticipant(req, res, next) {
  try {
    const joined = await joinTable({
      tableId: req.params.id,
      name: req.body.name,
      userId: req.auth?.type === "user" ? req.auth.userId : null,
    });
    return sendSuccess(res, 201, joined);
  } catch (err) {
    return next(err);
  }
}

async function getTableItems(req, res, next) {
  try {
    const result = await listItemsByTable(req.params.id, req.query);
    return sendSuccess(
      res,
      200,
      { tableId: req.params.id, items: result.data },
      { pagination: result.pagination }
    );
  } catch (err) {
    return next(err);
  }
}

async function getTableSummary(req, res, next) {
  try {
    const summary = await getSummary(req.params.id);
    return sendSuccess(res, 200, summary);
  } catch (err) {
    return next(err);
  }
}

async function putTableSplit(req, res, next) {
  try {
    const result = await applyTableSplit(req.params.id, req.body || {});
    const { warnings, ...data } = result;
    return sendSuccess(res, 200, data, warnings?.length ? { warnings } : undefined);
  } catch (err) {
    return next(err);
  }
}

async function postTableSplitReset(req, res, next) {
  try {
    const result = await resetTableSplit(req.businessId, req.params.id);
    return sendSuccess(res, 200, result);
  } catch (err) {
    return next(err);
  }
}

async function patchTableItemSplitEven(req, res, next) {
  try {
    const result = await splitItemEvenAmong({
      tableId: req.params.id,
      itemId: req.params.itemId,
      participantIds: req.body.participantIds,
    });
    return sendSuccess(res, 200, result);
  } catch (err) {
    return next(err);
  }
}

async function getTablePayments(req, res, next) {
  try {
    const result = await listPaymentsByTable(req.params.id, req.query);
    return sendSuccess(
      res,
      200,
      { tableId: req.params.id, payments: result.data },
      { pagination: result.pagination }
    );
  } catch (err) {
    return next(err);
  }
}

async function getStatus(req, res, next) {
  try {
    const status = await getTableStatus(req.params.id);
    return sendSuccess(res, 200, status);
  } catch (err) {
    return next(err);
  }
}

async function patchTableStatus(req, res, next) {
  try {
    if (req.body.status !== "CLOSED") {
      throw appError("Solo se permite actualizar status a CLOSED", 400, "VALIDATION");
    }
    const closed = await closeTable(req.params.id);
    return sendSuccess(res, 200, closed);
  } catch (err) {
    return next(err);
  }
}

async function deleteParticipantMe(req, res, next) {
  try {
    const result = await leaveTable({
      tableId: req.params.id,
      participantId: req.auth.participantId,
    });
    return sendSuccess(res, 200, result);
  } catch (err) {
    return next(err);
  }
}

async function deleteParticipantByStaff(req, res, next) {
  try {
    const result = await expelParticipant({
      businessId: req.businessId,
      tableId: req.params.id,
      participantId: req.params.participantId,
    });
    return sendSuccess(res, 200, result);
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  postTable,
  getTablesList,
  getTableByQr,
  getOneTable,
  getOneTableQrImage,
  getOneTableQrPng,
  patchTable,
  deleteOneTable,
  postTableParticipant,
  getTableItems,
  getTableSummary,
  putTableSplit,
  postTableSplitReset,
  patchTableItemSplitEven,
  getTablePayments,
  getStatus,
  patchTableStatus,
  deleteParticipantMe,
  deleteParticipantByStaff,
};
