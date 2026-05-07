const mongoose = require("mongoose");
const itemSchema = require("./schemas/item.schema");

const Item = mongoose.model("Item", itemSchema);

module.exports = Item;
