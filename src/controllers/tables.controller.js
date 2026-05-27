const {
  createTable,
  listTables,
  getTableByQrCode,
  getTableById,
  updateTable,
  deleteTable,
  joinTable,
  getSummary,
  getTableStatus,
  closeTable,
} = require("../services/table.service");
const { listItemsByTable, splitItemEvenAmong } = require("../services/item.service");
const { computeTableSplit } = require("../services/split.service");
const { listPaymentsByTable } = require("../services/payment.service");
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

async function postJoinTable(req, res, next) {
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

async function postTableSplit(req, res, next) {
  try {
    const summary = await getSummary(req.params.id);
    const participants = summary.participants;
    if (!participants.length) {
      throw appError("No hay participantes para dividir", 400, "VALIDATION");
    }
    const split = computeTableSplit(req.body.type, {
      unassignedItems: summary.unassignedItems,
      participants: participants.map((p) => ({
        participantId: p.participantId,
        name: p.name,
        debt: p.debt,
      })),
      subtotal: summary.subtotal,
      tipAmount: summary.tipAmount,
      grandTotal: summary.grandTotal,
    });
    const { warnings, ...data } = split;
    return sendSuccess(
      res,
      200,
      {
        tableId: summary.tableId,
        businessId: summary.businessId,
        ...data,
      },
      warnings.length ? { warnings } : undefined
    );
  } catch (err) {
    return next(err);
  }
}

async function postSplitItemEven(req, res, next) {
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

async function postCloseTable(req, res, next) {
  try {
    const closed = await closeTable(req.params.id);
    return sendSuccess(res, 200, closed);
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  postTable,
  getTablesList,
  getTableByQr,
  getOneTable,
  patchTable,
  deleteOneTable,
  postJoinTable,
  getTableItems,
  getTableSummary,
  postTableSplit,
  postSplitItemEven,
  getTablePayments,
  getStatus,
  postCloseTable,
};
