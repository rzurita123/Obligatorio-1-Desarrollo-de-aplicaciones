const { sendSuccess } = require("../utils/response.util");
const {
  listMyPaymentHistory,
  getMyStats: getMyStatsService,
  getMyProfile: getMyProfileService,
  updateMyAvatar: updateMyAvatarService,
  getMyActiveTable: getMyActiveTableService,
} = require("../services/me.service");
const {
  getBenefitsSnapshot,
  listLoyaltyMovements,
  redeemPoints,
} = require("../services/loyalty.service");
const {
  listPaymentMethods,
  createPaymentMethod,
  updatePaymentMethod,
  deletePaymentMethod,
} = require("../services/payment-method.service");

async function getMyPaymentsHistory(req, res, next) {
  try {
    const result = await listMyPaymentHistory(req.auth.userId, req.query);
    return sendSuccess(res, 200, { payments: result.data }, { pagination: result.pagination });
  } catch (err) {
    return next(err);
  }
}

async function getMyBenefits(req, res, next) {
  try {
    const account = await getBenefitsSnapshot(req.auth.userId);
    return sendSuccess(res, 200, account);
  } catch (err) {
    return next(err);
  }
}

async function getMyBenefitMovements(req, res, next) {
  try {
    const result = await listLoyaltyMovements(req.auth.userId, req.query);
    return sendSuccess(res, 200, { movements: result.data }, { pagination: result.pagination });
  } catch (err) {
    return next(err);
  }
}

async function postRedeemMyPoints(req, res, next) {
  try {
    const result = await redeemPoints({
      userId: req.auth.userId,
      points: req.body.points,
      description: req.body.description,
    });
    return sendSuccess(res, 200, result);
  } catch (err) {
    return next(err);
  }
}

async function getMyPaymentMethods(req, res, next) {
  try {
    const methods = await listPaymentMethods(req.auth.userId);
    return sendSuccess(res, 200, { paymentMethods: methods });
  } catch (err) {
    return next(err);
  }
}

async function postMyPaymentMethod(req, res, next) {
  try {
    const method = await createPaymentMethod(req.auth.userId, req.body);
    return sendSuccess(res, 201, method);
  } catch (err) {
    return next(err);
  }
}

async function patchMyPaymentMethod(req, res, next) {
  try {
    const method = await updatePaymentMethod(req.auth.userId, req.params.paymentMethodId, req.body);
    return sendSuccess(res, 200, method);
  } catch (err) {
    return next(err);
  }
}

async function deleteMyPaymentMethod(req, res, next) {
  try {
    const result = await deletePaymentMethod(req.auth.userId, req.params.paymentMethodId);
    return sendSuccess(res, 200, result);
  } catch (err) {
    return next(err);
  }
}

async function getMyStats(req, res, next) {
  try {
    const stats = await getMyStatsService(req.auth.userId, req.query);
    return sendSuccess(res, 200, stats);
  } catch (err) {
    return next(err);
  }
}

async function getMyProfile(req, res, next) {
  try {
    const profile = await getMyProfileService(req.auth.userId);
    return sendSuccess(res, 200, profile);
  } catch (err) {
    return next(err);
  }
}

async function patchMyAvatar(req, res, next) {
  try {
    const result = await updateMyAvatarService(req.auth.userId, req.body.avatarDataUrl);
    return sendSuccess(res, 200, result);
  } catch (err) {
    return next(err);
  }
}

async function getMyActiveTable(req, res, next) {
  try {
    const activeTable = await getMyActiveTableService(req.auth, req.query);
    return sendSuccess(res, 200, { activeTable });
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  getMyPaymentsHistory,
  getMyBenefits,
  getMyBenefitMovements,
  postRedeemMyPoints,
  getMyPaymentMethods,
  postMyPaymentMethod,
  patchMyPaymentMethod,
  deleteMyPaymentMethod,
  getMyStats,
  getMyProfile,
  patchMyAvatar,
  getMyActiveTable,
};
