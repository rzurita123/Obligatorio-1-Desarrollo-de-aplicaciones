//Modelos para registrar esquemas en Mongoose (populate).

require("./user.model");
require("./table.model");
require("./participant.model");
require("./item.model");
require("./payment.model");

module.exports = {
  User: require("./user.model"),
  Table: require("./table.model"),
  Participant: require("./participant.model"),
  Item: require("./item.model"),
  Payment: require("./payment.model"),
};
