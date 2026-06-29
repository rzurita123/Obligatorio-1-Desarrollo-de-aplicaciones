const express = require("express");
const authenticate = require("../middlewares/authenticate.middleware");
const { requireAdmin } = require("../middlewares/role.middleware");
const payloadMiddleware = require("../middlewares/payload.middleware");
const paramsMiddleware = require("../middlewares/params.middleware");
const { postAdminUser, patchAdminUser } = require("../controllers/admin-users.controller");
const {
  createAdminUserBodySchema,
  patchAdminUserBodySchema,
  adminUserIdParamSchema,
} = require("./validations/admin-user.validation");

const router = express.Router();

const adminChain = [authenticate, requireAdmin];

router.post("/", ...adminChain, payloadMiddleware(createAdminUserBodySchema), postAdminUser);
router.patch(
  "/:userId",
  ...adminChain,
  paramsMiddleware(adminUserIdParamSchema),
  payloadMiddleware(patchAdminUserBodySchema),
  patchAdminUser
);

module.exports = router;
