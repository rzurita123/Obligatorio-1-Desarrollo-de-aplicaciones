const { listBusinessesForUser } = require("../services/business.service");
const { sendSuccess } = require("../utils/response.util");

async function getAccessibleBusinesses(req, res, next) {
  try {
    const businesses = await listBusinessesForUser(req.auth.sub, req.auth.role);
    return sendSuccess(res, 200, { businesses });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getAccessibleBusinesses,
};
