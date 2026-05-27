const express = require("express");
const authenticate = require("../middlewares/authenticate.middleware");
const {
  requireAdminOrStaffOfBusiness,
  attachBusinessIdFromTable,
} = require("../middlewares/access-business.middleware");
const optionalAuthenticate = require("../middlewares/optional-authenticate.middleware");
const payloadMiddleware = require("../middlewares/payload.middleware");
const paramsMiddleware = require("../middlewares/params.middleware");
const queryMiddleware = require("../middlewares/query.middleware");
const {
  requireParticipant,
  requireParticipantTableParam,
} = require("../middlewares/participant.middleware");
const {
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
} = require("../controllers/tables.controller");
const {
  createTableSchema,
  listTablesQuerySchema,
  tableIdParamSchema,
  tableItemParamsSchema,
  tableQrQuerySchema,
  updateTableSchema,
  joinTableSchema,
  splitTableSchema,
  splitItemEvenBodySchema,
  listItemsQuerySchema,
  listPaymentsQuerySchema,
  qrCodeParamSchema,
} = require("./validations/tables.validation");

const router = express.Router();

const staffForList = [authenticate, queryMiddleware(listTablesQuerySchema), requireAdminOrStaffOfBusiness];

const staffForCreate = [authenticate, payloadMiddleware(createTableSchema), requireAdminOrStaffOfBusiness];

const staffForTableById = [
  authenticate,
  paramsMiddleware(tableIdParamSchema),
  attachBusinessIdFromTable,
  requireAdminOrStaffOfBusiness,
];

const staffForTableItem = [
  authenticate,
  paramsMiddleware(tableItemParamsSchema),
  attachBusinessIdFromTable,
  requireAdminOrStaffOfBusiness,
];

const participantForTable = [
  authenticate,
  requireParticipant,
  requireParticipantTableParam("id"),
];

router.get("/qr/:qrCode", paramsMiddleware(qrCodeParamSchema), queryMiddleware(tableQrQuerySchema), getTableByQr);

router.get("/", ...staffForList, getTablesList);
router.post("/", ...staffForCreate, postTable);

router.get("/:id", ...staffForTableById, getOneTable);
router.patch("/:id", ...staffForTableById, payloadMiddleware(updateTableSchema), patchTable);
router.delete("/:id", ...staffForTableById, deleteOneTable);

router.post(
  "/:id/join",
  paramsMiddleware(tableIdParamSchema),
  optionalAuthenticate,
  payloadMiddleware(joinTableSchema),
  postJoinTable
);

router.post(
  "/:id/items/:itemId/split-even",
  ...staffForTableItem,
  payloadMiddleware(splitItemEvenBodySchema),
  postSplitItemEven
);

router.get(
  "/:id/items",
  paramsMiddleware(tableIdParamSchema),
  ...participantForTable,
  queryMiddleware(listItemsQuerySchema),
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
  ...participantForTable,
  queryMiddleware(listPaymentsQuerySchema),
  getTablePayments
);
router.get("/:id/status", paramsMiddleware(tableIdParamSchema), ...participantForTable, getStatus);
router.post("/:id/close", paramsMiddleware(tableIdParamSchema), ...participantForTable, postCloseTable);

module.exports = router;
