const Joi = require("joi");

const objectIdSchema = Joi.string().trim().length(24).hex();

const createTableSchema = Joi.object({
  label: Joi.string().trim().min(1).max(80).optional(),
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
  createTableSchema,
  tableIdParamSchema,
  qrCodeParamSchema,
  joinTableSchema,
  splitTableSchema,
  listItemsQuerySchema,
  listPaymentsQuerySchema,
};
