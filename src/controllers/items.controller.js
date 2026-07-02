const { createItem, assignItem, deleteItem } = require("../services/item.service");
const { sendSuccess } = require("../utils/response.util");

async function postItem(req, res, next) {
  try {
    const item = await createItem(req.body);
    return sendSuccess(res, 201, item);
  } catch (err) {
    return next(err);
  }
}

async function patchItem(req, res, next) {
  try {
    const assigned = await assignItem({
      itemId: req.params.id,
      participantTableId: req.auth.tableId,
      assignments: req.body.assignments,
    });
    return sendSuccess(res, 200, assigned);
  } catch (err) {
    return next(err);
  }
}

async function deleteOneItem(req, res, next) {
  try {
    const deleted = await deleteItem({
      itemId: req.params.id,
      participantTableId: req.auth.tableId,
    });
    return sendSuccess(res, 200, deleted);
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  postItem,
  patchItem,
  deleteOneItem,
};
