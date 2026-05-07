const mongoose = require("mongoose");
const participantSchema = require("./schemas/participant.schema");

const Participant = mongoose.model("Participant", participantSchema);

module.exports = Participant;
