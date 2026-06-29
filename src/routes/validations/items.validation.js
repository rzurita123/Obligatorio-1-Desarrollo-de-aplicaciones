const Joi = require("joi");

const objectIdSchema = Joi.string().trim().length(24).hex();

const createItemSchema = Joi.object({
  tableId: objectIdSchema.required(),
  title: Joi.string().trim().min(2).max(120).required(),
  quantity: Joi.number().integer().min(1).default(1),
  amount: Joi.number().positive().required(),
});

const itemIdParamSchema = Joi.object({
  id: objectIdSchema.required(),
});

const assignItemSchema = Joi.object({
  assignments: Joi.array()
    .items(
      Joi.object({
        participantId: objectIdSchema.required(),
        amount: Joi.number().positive().required(),
      })
    )
    .min(1)
    .required(),
});

const patchItemSchema = assignItemSchema;

module.exports = {
  createItemSchema,
  itemIdParamSchema,
  assignItemSchema,
  patchItemSchema,
};
