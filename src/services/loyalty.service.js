const { LoyaltyAccount, LoyaltyLedger } = require("../models");
const { appError } = require("../utils/app-error.util");

function resolveTier(pointsBalance) {
  if (pointsBalance >= 10000) {
    return "GOLD";
  }
  if (pointsBalance >= 3000) {
    return "SILVER";
  }
  return "BASIC";
}

function pointsFromAmount(amount) {
  const numeric = Number(amount) || 0;
  if (numeric <= 0) {
    return 0;
  }
  return Math.max(1, Math.floor(numeric * 10));
}

async function getOrCreateLoyaltyAccount(userId) {
  const normalizedUserId = String(userId);
  let account = await LoyaltyAccount.findOne({ userId: normalizedUserId });

  if (!account) {
    account = await LoyaltyAccount.create({
      userId: normalizedUserId,
      pointsBalance: 0,
      lifetimeEarned: 0,
      tier: "BASIC",
    });
  }

  return account;
}

function formatAccount(account) {
  return {
    id: account._id.toString(),
    userId: account.userId.toString(),
    pointsBalance: account.pointsBalance,
    lifetimeEarned: account.lifetimeEarned,
    tier: account.tier,
    updatedAt: account.updatedAt,
  };
}

function formatMovement(entry) {
  return {
    id: entry._id.toString(),
    userId: entry.userId.toString(),
    type: entry.type,
    points: entry.points,
    sourceType: entry.sourceType,
    sourceId: entry.sourceId || null,
    description: entry.description || "",
    createdAt: entry.createdAt,
  };
}

async function listLoyaltyMovements(userId, query = {}) {
  const page = Number(query.page || 1);
  const limit = Number(query.limit || 20);
  const skip = (page - 1) * limit;

  const filters = { userId: String(userId) };
  if (query.type) {
    filters.type = query.type;
  }

  const [movements, total] = await Promise.all([
    LoyaltyLedger.find(filters).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    LoyaltyLedger.countDocuments(filters),
  ]);

  return {
    data: movements.map((entry) => formatMovement(entry)),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
}

async function getBenefitsSnapshot(userId) {
  const account = await getOrCreateLoyaltyAccount(userId);
  return formatAccount(account);
}

async function accruePointsFromPayment({ userId, paymentId, amount }) {
  if (!userId) {
    return { pointsEarned: 0, account: null };
  }

  const earnedPoints = pointsFromAmount(amount);
  if (earnedPoints <= 0) {
    const account = await getOrCreateLoyaltyAccount(userId);
    return { pointsEarned: 0, account: formatAccount(account) };
  }

  const normalizedPaymentId = String(paymentId);
  const normalizedUserId = String(userId);

  const existing = await LoyaltyLedger.findOne({
    userId: normalizedUserId,
    type: "EARN",
    sourceType: "PAYMENT",
    sourceId: normalizedPaymentId,
  });

  if (existing) {
    const account = await getOrCreateLoyaltyAccount(normalizedUserId);
    return {
      pointsEarned: 0,
      idempotentReplay: true,
      account: formatAccount(account),
      movement: formatMovement(existing),
    };
  }

  const account = await getOrCreateLoyaltyAccount(normalizedUserId);

  const movement = await LoyaltyLedger.create({
    userId: normalizedUserId,
    type: "EARN",
    points: earnedPoints,
    sourceType: "PAYMENT",
    sourceId: normalizedPaymentId,
    description: `Pago ${normalizedPaymentId}`,
  });

  account.pointsBalance += earnedPoints;
  account.lifetimeEarned += earnedPoints;
  account.tier = resolveTier(account.pointsBalance);
  await account.save();

  return {
    pointsEarned: earnedPoints,
    idempotentReplay: false,
    account: formatAccount(account),
    movement: formatMovement(movement),
  };
}

async function redeemPoints({ userId, points, description }) {
  const pointsInt = Number(points);
  if (!Number.isInteger(pointsInt) || pointsInt <= 0) {
    throw appError("Cantidad de puntos inválida", 400, "VALIDATION");
  }

  const account = await getOrCreateLoyaltyAccount(userId);
  if (account.pointsBalance < pointsInt) {
    throw appError("Saldo de puntos insuficiente", 400, "VALIDATION");
  }

  const movement = await LoyaltyLedger.create({
    userId: String(userId),
    type: "REDEEM",
    points: -pointsInt,
    sourceType: "REWARD",
    sourceId: null,
    description: description || "Canje de beneficios",
  });

  account.pointsBalance -= pointsInt;
  account.tier = resolveTier(account.pointsBalance);
  await account.save();

  return {
    account: formatAccount(account),
    movement: formatMovement(movement),
  };
}

module.exports = {
  getBenefitsSnapshot,
  listLoyaltyMovements,
  accruePointsFromPayment,
  redeemPoints,
};
