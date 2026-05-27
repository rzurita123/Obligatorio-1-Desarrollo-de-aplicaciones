const Joi = require("joi");

const objectIdSchema = Joi.string().trim().length(24).hex();

const createTableSchema = Joi.object({
  businessId: objectIdSchema.required(),
  label: Joi.string().trim().min(1).max(80).required(),
});

const updateTableSchema = Joi.object({
  label: Joi.string().trim().min(1).max(80).optional(),
  tipMode: Joi.string().valid("none", "percent", "fixed").optional(),
  tipValue: Joi.number().min(0).max(1000000).optional(),
})
  .min(1)
  .messages({
    "object.min": "Debe enviarse al menos label o tipMode/tipValue",
  });

const listTablesQuerySchema = Joi.object({
  businessId: objectIdSchema.required(),
  id: objectIdSchema.optional(),
  qrCode: Joi.string().trim().min(3).max(120).optional(),
  label: Joi.string().trim().min(1).max(80).optional(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(50),
});

const tableIdParamSchema = Joi.object({
  id: objectIdSchema.required(),
});

const qrCodeParamSchema = Joi.object({
  qrCode: Joi.string().trim().min(3).max(120).required(),
});

const joinTableSchema = Joi.object({
  name: Joi.string().trim().min(2).max(60).required(),
});

const splitTableSchema = Joi.object({
  type: Joi.string().valid("equal", "byItems").required(),
});

const tableItemParamsSchema = Joi.object({
  id: objectIdSchema.required(),
  itemId: objectIdSchema.required(),
});

const tableQrQuerySchema = Joi.object({
  businessId: objectIdSchema.required(),
});

const splitItemEvenBodySchema = Joi.object({
  participantIds: Joi.array().items(objectIdSchema).min(1).required(),
});

const listItemsQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  assigned: Joi.boolean().optional(),
  search: Joi.string().trim().max(120).optional(),
});

const listPaymentsQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  participantId: objectIdSchema.optional(),
  from: Joi.date().iso().optional(),
  to: Joi.date().iso().optional(),
});

module.exports = {
  objectIdSchema,
  createTableSchema,
  updateTableSchema,
  listTablesQuerySchema,
  tableItemParamsSchema,
  tableQrQuerySchema,
  tableIdParamSchema,
  qrCodeParamSchema,
  joinTableSchema,
  splitTableSchema,
  splitItemEvenBodySchema,
  listItemsQuerySchema,
  listPaymentsQuerySchema,
};
