const mongoose = require("mongoose");
const paymentMethodSchema = require("./schemas/payment-method.schema");

const PaymentMethod = mongoose.model("PaymentMethod", paymentMethodSchema);

module.exports = PaymentMethod;
