const {
  createBusiness,
  listBusinessesAdmin,
  getBusinessById,
  updateBusiness,
  deactivateBusiness,
  assignStaffToBusiness,
  removeStaffFromBusiness,
} = require("../services/business.service");
const { sendSuccess } = require("../utils/response.util");

async function postAdminBusiness(req, res, next) {
  try {
    const business = await createBusiness(req.body || {});
    return sendSuccess(res, 201, { business });
  } catch (err) {
    next(err);
  }
}

async function getAdminBusinesses(req, res, next) {
  try {
    const businesses = await listBusinessesAdmin();
    return sendSuccess(res, 200, { businesses });
  } catch (err) {
    next(err);
  }
}

async function getAdminBusinessById(req, res, next) {
  try {
    const business = await getBusinessById(req.params.businessId);
    return sendSuccess(res, 200, { business });
  } catch (err) {
    next(err);
  }
}

async function patchAdminBusiness(req, res, next) {
  try {
    const business = await updateBusiness(req.params.businessId, req.body || {});
    return sendSuccess(res, 200, { business });
  } catch (err) {
    next(err);
  }
}

async function deleteAdminBusiness(req, res, next) {
  try {
    const business = await deactivateBusiness(req.params.businessId);
    return sendSuccess(res, 200, { business });
  } catch (err) {
    next(err);
  }
}

async function postAdminBusinessStaff(req, res, next) {
  try {
    const result = await assignStaffToBusiness({
      businessId: req.params.businessId,
      userId: req.body.userId,
    });
    return sendSuccess(res, 201, result);
  } catch (err) {
    next(err);
  }
}

async function deleteAdminBusinessStaff(req, res, next) {
  try {
    const result = await removeStaffFromBusiness({
      businessId: req.params.businessId,
      userId: req.params.userId,
    });
    return sendSuccess(res, 200, result);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  postAdminBusiness,
  getAdminBusinesses,
  getAdminBusinessById,
  patchAdminBusiness,
  deleteAdminBusiness,
  postAdminBusinessStaff,
  deleteAdminBusinessStaff,
};
