const express = require("express");
const payloadMiddleware = require("../middlewares/payload.middleware");
const paramsMiddleware = require("../middlewares/params.middleware");
const queryMiddleware = require("../middlewares/query.middleware");
const authenticate = require("../middlewares/authenticate.middleware");
const {
  requireParticipant,
  requireParticipantTableParam,
} = require("../middlewares/participant.middleware");
const {
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
} = require("../controllers/tables.controller");
const {
  createTableSchema,
  listTablesQuerySchema,
  tableIdParamSchema,
  qrCodeParamSchema,
  joinTableSchema,
  splitTableSchema,
  listItemsQuerySchema,
  listPaymentsQuerySchema,
} = require("./validations/tables.validation");

const router = express.Router();

/** Token de participante + mismo tableId que en la ruta */
const participantForTable = [
  authenticate,
  requireParticipant,
  requireParticipantTableParam("id"),
];

// Orden: rutas fijas antes de /:id...
router.get("/", queryMiddleware(listTablesQuerySchema), getTablesList);
router.post("/", payloadMiddleware(createTableSchema), postTable);
router.get("/qr/:qrCode", paramsMiddleware(qrCodeParamSchema), getTableByQr);

router.post("/:id/join", paramsMiddleware(tableIdParamSchema), payloadMiddleware(joinTableSchema), postJoinTable);

router.get(
  "/:id/items",
  paramsMiddleware(tableIdParamSchema),
  queryMiddleware(listItemsQuerySchema),
  ...participantForTable,
  getTableItems
);
router.get("/:id/summary", paramsMiddleware(tableIdParamSchema), ...participantForTable, getTableSummary);
router.post(
  "/:id/split",
  paramsMiddleware(tableIdParamSchema),
  ...participantForTable,
  payloadMiddleware(splitTableSchema),
  postTableSplit
);
router.get(
  "/:id/payments",
  paramsMiddleware(tableIdParamSchema),
  queryMiddleware(listPaymentsQuerySchema),
  ...participantForTable,
  getTablePayments
);
router.get("/:id/status", paramsMiddleware(tableIdParamSchema), ...participantForTable, getStatus);
router.post("/:id/close", paramsMiddleware(tableIdParamSchema), ...participantForTable, postCloseTable);

module.exports = router;
