const express = require("express");
const authenticate = require("../middlewares/authenticate.middleware");
const payloadMiddleware = require("../middlewares/payload.middleware");
const paramsMiddleware = require("../middlewares/params.middleware");
const {
  requireParticipant,
  requireBodyTableIdMatchesParticipant,
} = require("../middlewares/participant.middleware");
const { postItem, patchItem } = require("../controllers/items.controller");
const {
  createItemSchema,
  itemIdParamSchema,
  patchItemSchema,
} = require("./validations/items.validation");

const router = express.Router();

const createItemChain = [
  authenticate,
  requireParticipant,
  requireBodyTableIdMatchesParticipant,
];

router.post("/", ...createItemChain, payloadMiddleware(createItemSchema), postItem);
router.patch(
  "/:id",
  paramsMiddleware(itemIdParamSchema),
  authenticate,
  requireParticipant,
  payloadMiddleware(patchItemSchema),
  patchItem
);

module.exports = router;
