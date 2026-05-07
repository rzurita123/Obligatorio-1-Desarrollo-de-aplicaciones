const express = require("express");
const authenticate = require("../middlewares/authenticate.middleware");
const payloadMiddleware = require("../middlewares/payload.middleware");
const paramsMiddleware = require("../middlewares/params.middleware");
const {
  requireParticipant,
  requireBodyTableIdMatchesParticipant,
} = require("../middlewares/participant.middleware");
const { postItem, postAssignItem } = require("../controllers/items.controller");
const {
  createItemSchema,
  itemIdParamSchema,
  assignItemSchema,
} = require("./validations/items.validation");

const router = express.Router();

//Crear ítem: body debe incluir `tableId` alineado al token de participante.
const createItemChain = [
  authenticate,
  requireParticipant,
  requireBodyTableIdMatchesParticipant,
];

router.post("/", ...createItemChain, payloadMiddleware(createItemSchema), postItem);
router.post(
  "/:id/assign",
  paramsMiddleware(itemIdParamSchema),
  authenticate,
  requireParticipant,
  payloadMiddleware(assignItemSchema),
  postAssignItem
);

module.exports = router;
