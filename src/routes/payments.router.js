const express = require("express");
const authenticate = require("../middlewares/authenticate.middleware");
const payloadMiddleware = require("../middlewares/payload.middleware");
const {
  requireParticipant,
  requireBodyTableIdMatchesParticipant,
} = require("../middlewares/participant.middleware");
const { postPayment } = require("../controllers/payments.controller");
const { createPaymentSchema } = require("./validations/payments.validation");

const router = express.Router();

router.post(
  "/",
  authenticate,
  requireParticipant,
  requireBodyTableIdMatchesParticipant,
  payloadMiddleware(createPaymentSchema),
  postPayment
);

module.exports = router;
