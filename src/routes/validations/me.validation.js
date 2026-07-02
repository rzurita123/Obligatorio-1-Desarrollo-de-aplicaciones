const Joi = require("joi");

const objectIdSchema = Joi.string().trim().length(24).hex();

const myPaymentsHistoryQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  status: Joi.string().valid("COMPLETED").optional(),
  from: Joi.date().iso().optional(),
  to: Joi.date().iso().optional(),
  tableId: objectIdSchema.optional(),
  businessId: objectIdSchema.optional(),
});

const myBenefitMovementsQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  type: Joi.string().valid("EARN", "REDEEM", "ADJUSTMENT").optional(),
});

const redeemPointsSchema = Joi.object({
  points: Joi.number().integer().min(1).required(),
  description: Joi.string().trim().max(240).optional().allow("", null),
});

const createPaymentMethodSchema = Joi.object({
  provider: Joi.string().trim().min(2).max(40).optional(),
  brand: Joi.string().trim().min(2).max(40).required(),
  last4: Joi.string().trim().pattern(/^\d{4}$/).required(),
  expMonth: Joi.number().integer().min(1).max(12).optional(),
  expYear: Joi.number().integer().min(2000).max(3000).optional(),
  tokenRef: Joi.string().trim().min(6).max(240).required(),
  alias: Joi.string().trim().max(80).optional().allow("", null),
  isDefault: Joi.boolean().optional(),
});

const updatePaymentMethodSchema = Joi.object({
  alias: Joi.string().trim().max(80).optional().allow("", null),
  expMonth: Joi.number().integer().min(1).max(12).optional(),
  expYear: Joi.number().integer().min(2000).max(3000).optional(),
  isDefault: Joi.boolean().optional(),
  active: Joi.boolean().optional(),
}).min(1);

const paymentMethodIdParamSchema = Joi.object({
  paymentMethodId: objectIdSchema.required(),
});

const myStatsQuerySchema = Joi.object({
  rangeDays: Joi.number().integer().valid(7, 30, 90, 180, 365).default(30),
});

const updateMyAvatarSchema = Joi.object({
  avatarDataUrl: Joi.string().trim().max(3000000).allow(null).required(),
});

module.exports = {
  myPaymentsHistoryQuerySchema,
  myBenefitMovementsQuerySchema,
  redeemPointsSchema,
  createPaymentMethodSchema,
  updatePaymentMethodSchema,
  paymentMethodIdParamSchema,
  myStatsQuerySchema,
  updateMyAvatarSchema,
};
