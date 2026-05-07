const mongoose = require("mongoose");
const paymentSchema = require("./schemas/payment.schema");

const Payment = mongoose.model("Payment", paymentSchema);

module.exports = Payment;
