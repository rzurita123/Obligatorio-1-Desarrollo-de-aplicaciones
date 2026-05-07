const mongoose = require("mongoose");
const tableSchema = require("./schemas/table.schema");

const Table = mongoose.model("Table", tableSchema);

module.exports = Table;
