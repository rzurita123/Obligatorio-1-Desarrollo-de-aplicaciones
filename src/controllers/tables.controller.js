const {
  createTable,
  listTables,
  getTableByQrCode,
  joinTable,
  getSummary,
  getTableStatus,
  closeTable,
} = require("../services/table.service");
const { listItemsByTable } = require("../services/item.service");
const { listPaymentsByTable } = require("../services/payment.service");
const { sendSuccess } = require("../utils/response.util");
const { appError } = require("../utils/app-error.util");

async function postTable(req, res, next) {
  try {
    const table = await createTable(req.body || {});
    return sendSuccess(res, 201, table);
  } catch (err) {
    return next(err);
  }
}

async function getTablesList(req, res, next) {
  try {
    const result = await listTables(req.query);
    return sendSuccess(res, 200, { tables: result.data }, { pagination: result.pagination });
  } catch (err) {
    return next(err);
  }
}

async function getTableByQr(req, res, next) {
  try {
    const table = await getTableByQrCode(req.params.qrCode);
    return sendSuccess(res, 200, table);
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
    const result = {
      tableId: summary.tableId,
      splitType: req.body.type,
      totalAmount: summary.totalAmount,
      participants: participants.map((p) => ({
        participantId: p.participantId,
        suggestedAmount: Number((summary.totalAmount / participants.length).toFixed(2)),
      })),
    };
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
  postJoinTable,
  getTableItems,
  getTableSummary,
  postTableSplit,
  getTablePayments,
  getStatus,
  postCloseTable,
};
