const express = require("express");
const authenticate = require("../middlewares/authenticate.middleware");
const { requirePlatformUser } = require("../middlewares/access-business.middleware");
const payloadMiddleware = require("../middlewares/payload.middleware");
const queryMiddleware = require("../middlewares/query.middleware");
const paramsMiddleware = require("../middlewares/params.middleware");
const {
  getMyPaymentsHistory,
  getMyBenefits,
  getMyBenefitMovements,
  postRedeemMyPoints,
  getMyPaymentMethods,
  postMyPaymentMethod,
  patchMyPaymentMethod,
  deleteMyPaymentMethod,
  getMyStats,
} = require("../controllers/me.controller");
const {
  myPaymentsHistoryQuerySchema,
  myBenefitMovementsQuerySchema,
  redeemPointsSchema,
  createPaymentMethodSchema,
  updatePaymentMethodSchema,
  paymentMethodIdParamSchema,
  myStatsQuerySchema,
} = require("./validations/me.validation");

const router = express.Router();

router.use(authenticate, requirePlatformUser);

router.get("/payments/history", queryMiddleware(myPaymentsHistoryQuerySchema), getMyPaymentsHistory);
router.get("/benefits", getMyBenefits);
router.get("/benefits/movements", queryMiddleware(myBenefitMovementsQuerySchema), getMyBenefitMovements);
router.post("/benefits/redeem", payloadMiddleware(redeemPointsSchema), postRedeemMyPoints);

router.get("/payment-methods", getMyPaymentMethods);
router.post("/payment-methods", payloadMiddleware(createPaymentMethodSchema), postMyPaymentMethod);
router.patch(
  "/payment-methods/:paymentMethodId",
  paramsMiddleware(paymentMethodIdParamSchema),
  payloadMiddleware(updatePaymentMethodSchema),
  patchMyPaymentMethod
);
router.delete(
  "/payment-methods/:paymentMethodId",
  paramsMiddleware(paymentMethodIdParamSchema),
  deleteMyPaymentMethod
);

router.get("/stats", queryMiddleware(myStatsQuerySchema), getMyStats);

module.exports = router;
