const jwt = require("jsonwebtoken");
const config = require("../config");
const { USER_ROLES } = require("../constants/user-role.constant");

function getSecret() {
  const s = config.auth.secret;
  if (!s) {
    throw new Error("AUTH_SECRET_KEY no está definida");
  }
  return s;
}

//Usuario registrado (login / signup).

function signUserToken(userDoc) {
  const id = userDoc._id.toString();
  const role = userDoc.role || USER_ROLES.CUSTOMER;
  return jwt.sign(
    {
      sub: id,
      type: "user",
      username: userDoc.username,
      role,
    },
    getSecret(),
    { expiresIn: "8h" }
  );
}


//Participante de mesa (emitido tras POST /tables/:id/participants).
 
function signParticipantToken({ participant, tableId }) {
  const pid = participant._id.toString();
  const tid = typeof tableId === "string" ? tableId : tableId.toString();
  return jwt.sign(
    {
      sub: pid,
      type: "participant",
      participantId: pid,
      tableId: tid,
      userId: participant.userId ? participant.userId.toString() : null,
    },
    getSecret(),
    { expiresIn: "24h" }
  );
}

function verifyTokenString(token) {
  return jwt.verify(token, getSecret());
}

module.exports = {
  signUserToken,
  signParticipantToken,
  verifyTokenString,
};
