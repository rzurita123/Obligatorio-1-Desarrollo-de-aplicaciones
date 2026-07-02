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
  getOneTableQrImage,
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
  patchTableStatusSchema,
  listItemsQuerySchema,
  listPaymentsQuerySchema,
  qrCodeParamSchema,
  participantIdParamSchema,
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
router.get("/:id/qr-image", ...staffForTableById, getOneTableQrImage);
router.patch("/:id", ...staffForTableById, payloadMiddleware(updateTableSchema), patchTable);
router.delete("/:id", ...staffForTableById, deleteOneTable);

router.post(
  "/:id/participants",
  paramsMiddleware(tableIdParamSchema),
  optionalAuthenticate,
  payloadMiddleware(joinTableSchema),
  postTableParticipant
);

router.patch(
  "/:id/items/:itemId",
  ...staffForTableItem,
  payloadMiddleware(splitItemEvenBodySchema),
  patchTableItemSplitEven
);

router.get(
  "/:id/items",
  paramsMiddleware(tableIdParamSchema),
  ...participantForTable,
  queryMiddleware(listItemsQuerySchema),
  getTableItems
);
router.get("/:id/summary", paramsMiddleware(tableIdParamSchema), ...participantForTable, getTableSummary);

router.put(
  "/:id/split",
  paramsMiddleware(tableIdParamSchema),
  ...participantForTable,
  payloadMiddleware(splitTableSchema),
  putTableSplit
);
router.post("/:id/split/reset", ...staffForTableById, postTableSplitReset);

router.get(
  "/:id/payments",
  paramsMiddleware(tableIdParamSchema),
  ...participantForTable,
  queryMiddleware(listPaymentsQuerySchema),
  getTablePayments
);
router.get("/:id/status", paramsMiddleware(tableIdParamSchema), ...participantForTable, getStatus);
router.patch(
  "/:id/status",
  paramsMiddleware(tableIdParamSchema),
  ...participantForTable,
  payloadMiddleware(patchTableStatusSchema),
  patchTableStatus
);

router.delete(
  "/:id/participants/me",
  paramsMiddleware(tableIdParamSchema),
  ...participantForTable,
  deleteParticipantMe
);
router.delete(
  "/:id/participants/:participantId",
  ...staffForTableById,
  paramsMiddleware(participantIdParamSchema),
  deleteParticipantByStaff
);

module.exports = router;
