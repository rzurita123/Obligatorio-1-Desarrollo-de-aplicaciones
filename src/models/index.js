//Modelos para registrar esquemas en Mongoose (populate).

require("./user.model");
require("./business.model");
require("./staff-assignment.model");
require("./table.model");
require("./participant.model");
require("./item.model");
require("./payment.model");

module.exports = {
  User: require("./user.model"),
  Business: require("./business.model"),
  StaffAssignment: require("./staff-assignment.model"),
  Table: require("./table.model"),
  Participant: require("./participant.model"),
  Item: require("./item.model"),
  Payment: require("./payment.model"),
};
