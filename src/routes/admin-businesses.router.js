const express = require("express");
const authenticate = require("../middlewares/authenticate.middleware");
const { requireAdmin } = require("../middlewares/role.middleware");
const payloadMiddleware = require("../middlewares/payload.middleware");
const paramsMiddleware = require("../middlewares/params.middleware");
const {
  postAdminBusiness,
  getAdminBusinesses,
  getAdminBusinessById,
  patchAdminBusiness,
  deleteAdminBusiness,
  postAdminBusinessStaff,
  deleteAdminBusinessStaff,
} = require("../controllers/admin-businesses.controller");
const {
  createBusinessBodySchema,
  updateBusinessBodySchema,
  adminBusinessIdParamSchema,
  assignStaffBodySchema,
  adminBusinessStaffUserParamSchema,
} = require("./validations/admin-business.validation");

const router = express.Router();

const adminChain = [authenticate, requireAdmin];

router.post("/", ...adminChain, payloadMiddleware(createBusinessBodySchema), postAdminBusiness);
router.get("/", ...adminChain, getAdminBusinesses);
router.get("/:businessId", ...adminChain, paramsMiddleware(adminBusinessIdParamSchema), getAdminBusinessById);
router.patch(
  "/:businessId",
  ...adminChain,
  paramsMiddleware(adminBusinessIdParamSchema),
  payloadMiddleware(updateBusinessBodySchema),
  patchAdminBusiness
);
router.delete("/:businessId", ...adminChain, paramsMiddleware(adminBusinessIdParamSchema), deleteAdminBusiness);

router.post(
  "/:businessId/staff",
  ...adminChain,
  paramsMiddleware(adminBusinessIdParamSchema),
  payloadMiddleware(assignStaffBodySchema),
  postAdminBusinessStaff
);
router.delete(
  "/:businessId/staff/:userId",
  ...adminChain,
  paramsMiddleware(adminBusinessStaffUserParamSchema),
  deleteAdminBusinessStaff
);

module.exports = router;
