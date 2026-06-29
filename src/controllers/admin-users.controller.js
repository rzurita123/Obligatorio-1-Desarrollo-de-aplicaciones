const { createUserByAdmin, updateUserRole } = require("../services/admin-user.service");
const { sendSuccess } = require("../utils/response.util");

async function postAdminUser(req, res, next) {
  try {
    const user = await createUserByAdmin(req.body || {});
    return sendSuccess(res, 201, { user });
  } catch (err) {
    next(err);
  }
}

async function patchAdminUser(req, res, next) {
  try {
    const user = await updateUserRole(
      req.params.userId,
      req.body.role,
      req.auth.sub
    );
    return sendSuccess(res, 200, { user });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  postAdminUser,
  patchAdminUser,
};
