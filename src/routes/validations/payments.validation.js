const Joi = require("joi");

const objectIdSchema = Joi.string().trim().length(24).hex();

const createPaymentSchema = Joi.object({
  tableId: objectIdSchema.required(),
  amount: Joi.number().positive().required(),
  clientPaymentId: Joi.string().trim().min(2).max(120).optional().allow("", null),
});

module.exports = {
  createPaymentSchema,
};
