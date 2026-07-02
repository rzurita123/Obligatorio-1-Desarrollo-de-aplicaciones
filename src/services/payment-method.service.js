const { PaymentMethod } = require("../models");
const { appError } = require("../utils/app-error.util");

function formatPaymentMethod(entry) {
  return {
    id: entry._id.toString(),
    userId: entry.userId.toString(),
    provider: entry.provider,
    type: entry.type,
    brand: entry.brand,
    last4: entry.last4,
    expMonth: entry.expMonth,
    expYear: entry.expYear,
    alias: entry.alias || "",
    isDefault: Boolean(entry.isDefault),
    active: Boolean(entry.active),
    createdAt: entry.createdAt,
    updatedAt: entry.updatedAt,
  };
}

async function listPaymentMethods(userId) {
  const entries = await PaymentMethod.find({ userId: String(userId), active: true })
    .sort({ isDefault: -1, createdAt: -1 })
    .lean();
  return entries.map((entry) => formatPaymentMethod(entry));
}

async function createPaymentMethod(userId, payload) {
  const normalizedUserId = String(userId);
  const hasActive = await PaymentMethod.exists({ userId: normalizedUserId, active: true });
  const desiredDefault = payload.isDefault === true || !hasActive;

  if (desiredDefault) {
    await PaymentMethod.updateMany(
      { userId: normalizedUserId, active: true },
      { $set: { isDefault: false } }
    );
  }

  const created = await PaymentMethod.create({
    userId: normalizedUserId,
    provider: payload.provider || "mock",
    type: "card",
    brand: payload.brand,
    last4: payload.last4,
    expMonth: payload.expMonth ?? null,
    expYear: payload.expYear ?? null,
    tokenRef: payload.tokenRef,
    alias: payload.alias || "",
    isDefault: desiredDefault,
    active: true,
  });

  return formatPaymentMethod(created);
}

async function updatePaymentMethod(userId, paymentMethodId, payload) {
  const normalizedUserId = String(userId);

  const current = await PaymentMethod.findOne({ _id: paymentMethodId, userId: normalizedUserId, active: true });
  if (!current) {
    throw appError("Método de pago no encontrado", 404, "NOT_FOUND");
  }

  if (payload.isDefault === true) {
    await PaymentMethod.updateMany(
      { userId: normalizedUserId, active: true },
      { $set: { isDefault: false } }
    );
    current.isDefault = true;
  }

  if (payload.alias !== undefined) {
    current.alias = payload.alias;
  }

  if (payload.active !== undefined) {
    current.active = payload.active;
  }

  if (payload.expMonth !== undefined) {
    current.expMonth = payload.expMonth;
  }

  if (payload.expYear !== undefined) {
    current.expYear = payload.expYear;
  }

  await current.save();

  if (current.active === false) {
    const anyDefault = await PaymentMethod.findOne({ userId: normalizedUserId, active: true, isDefault: true });
    if (!anyDefault) {
      const newest = await PaymentMethod.findOne({ userId: normalizedUserId, active: true }).sort({ createdAt: -1 });
      if (newest) {
        newest.isDefault = true;
        await newest.save();
      }
    }
  }

  return formatPaymentMethod(current);
}

async function deletePaymentMethod(userId, paymentMethodId) {
  const normalizedUserId = String(userId);
  const current = await PaymentMethod.findOne({ _id: paymentMethodId, userId: normalizedUserId, active: true });
  if (!current) {
    throw appError("Método de pago no encontrado", 404, "NOT_FOUND");
  }

  current.active = false;
  current.isDefault = false;
  await current.save();

  const newest = await PaymentMethod.findOne({ userId: normalizedUserId, active: true }).sort({ createdAt: -1 });
  if (newest) {
    newest.isDefault = true;
    await newest.save();
  }

  return {
    id: current._id.toString(),
    removed: true,
  };
}

module.exports = {
  listPaymentMethods,
  createPaymentMethod,
  updatePaymentMethod,
  deletePaymentMethod,
};
