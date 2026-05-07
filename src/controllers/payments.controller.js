const { createPayment } = require("../services/payment.service");
const { sendSuccess } = require("../utils/response.util");

async function postPayment(req, res, next) {
  try {
    const result = await createPayment({
      tableId: req.body.tableId,
      participantId: req.auth.participantId,
      amount: req.body.amount,
      clientPaymentId: req.body.clientPaymentId || req.headers["idempotency-key"],
    });
    return sendSuccess(res, result.idempotentReplay ? 200 : 201, result);
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  postPayment,
};
