const mongoose = require("mongoose");
const staffAssignmentSchema = require("./schemas/staff-assignment.schema");

const StaffAssignment = mongoose.model("StaffAssignment", staffAssignmentSchema);

module.exports = StaffAssignment;
