const mongoose = require("mongoose");
const { Participant, Payment, Table, Business, User, StaffAssignment } = require("../models");
const { appError } = require("../utils/app-error.util");
const { signParticipantToken } = require("../utils/jwt.util");
const { userHasAccessToBusiness } = require("./business.service");
const { USER_ROLES } = require("../constants/user-role.constant");

function asObjectId(value, fieldName) {
  if (!mongoose.Types.ObjectId.isValid(String(value))) {
    throw appError(`${fieldName} inválido`, 400, "VALIDATION");
  }
  return new mongoose.Types.ObjectId(String(value));
}

async function listMyPaymentHistory(userId, query = {}) {
  const page = Number(query.page || 1);
  const limit = Number(query.limit || 20);
  const skip = (page - 1) * limit;

  const pipeline = [
    {
      $lookup: {
        from: "participants",
        localField: "participantId",
        foreignField: "_id",
        as: "participant",
      },
    },
    { $unwind: "$participant" },
    { $match: { "participant.userId": asObjectId(userId, "userId") } },
  ];

  if (query.from || query.to) {
    const dateMatch = {};
    if (query.from) {
      dateMatch.$gte = new Date(query.from);
    }
    if (query.to) {
      dateMatch.$lte = new Date(query.to);
    }
    pipeline.push({ $match: { createdAt: dateMatch } });
  }

  if (query.status) {
    pipeline.push({ $match: { status: query.status } });
  }

  pipeline.push(
    {
      $lookup: {
        from: "tables",
        localField: "tableId",
        foreignField: "_id",
        as: "table",
      },
    },
    { $unwind: { path: "$table", preserveNullAndEmptyArrays: true } }
  );

  if (query.tableId) {
    pipeline.push({ $match: { tableId: asObjectId(query.tableId, "tableId") } });
  }

  if (query.businessId) {
    pipeline.push({ $match: { "table.businessId": asObjectId(query.businessId, "businessId") } });
  }

  pipeline.push(
    {
      $lookup: {
        from: "businesses",
        localField: "table.businessId",
        foreignField: "_id",
        as: "business",
      },
    },
    { $unwind: { path: "$business", preserveNullAndEmptyArrays: true } }
  );

  const countPipeline = [...pipeline, { $count: "total" }];

  const listPipeline = [
    ...pipeline,
    { $sort: { createdAt: -1 } },
    { $skip: skip },
    { $limit: limit },
    {
      $project: {
        _id: 0,
        id: { $toString: "$_id" },
        amount: 1,
        status: 1,
        clientPaymentId: { $ifNull: ["$clientPaymentId", null] },
        createdAt: 1,
        table: {
          id: {
            $cond: [
              { $ifNull: ["$table._id", false] },
              { $toString: "$table._id" },
              null,
            ],
          },
          label: "$table.label",
          status: "$table.status",
        },
        business: {
          id: {
            $cond: [
              { $ifNull: ["$business._id", false] },
              { $toString: "$business._id" },
              null,
            ],
          },
          name: "$business.name",
          slug: "$business.slug",
        },
        participant: {
          id: { $toString: "$participant._id" },
          name: "$participant.name",
        },
      },
    },
  ];

  const [rows, totalRows] = await Promise.all([
    Payment.aggregate(listPipeline),
    Payment.aggregate(countPipeline),
  ]);

  const total = totalRows?.[0]?.total || 0;

  return {
    data: rows,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
}

async function getMyStats(userId, query = {}) {
  const rangeDays = Number(query.rangeDays || 30);
  const fromDate = new Date();
  fromDate.setDate(fromDate.getDate() - rangeDays);

  const participants = await Participant.find({ userId: String(userId) }).select("_id tableId").lean();
  if (!participants.length) {
    return {
      rangeDays,
      totals: {
        paymentsCount: 0,
        totalSpent: 0,
        averageTicket: 0,
      },
      tables: {
        visited: 0,
      },
      favoriteBusiness: null,
    };
  }

  const participantIds = participants.map((p) => p._id);
  const payments = await Payment.find({
    participantId: { $in: participantIds },
    createdAt: { $gte: fromDate },
  })
    .sort({ createdAt: -1 })
    .lean();

  if (!payments.length) {
    return {
      rangeDays,
      totals: {
        paymentsCount: 0,
        totalSpent: 0,
        averageTicket: 0,
      },
      tables: {
        visited: 0,
      },
      favoriteBusiness: null,
    };
  }

  const tableIds = [...new Set(payments.map((p) => String(p.tableId)))];
  const tables = await Table.find({ _id: { $in: tableIds } }).select("_id businessId label").lean();
  const businessIds = [...new Set(tables.map((t) => String(t.businessId)))];
  const businesses = await Business.find({ _id: { $in: businessIds } }).select("_id name slug").lean();

  const tableById = new Map(tables.map((t) => [String(t._id), t]));
  const businessById = new Map(businesses.map((b) => [String(b._id), b]));

  const totalSpent = payments.reduce((acc, p) => acc + (Number(p.amount) || 0), 0);
  const paymentsCount = payments.length;
  const averageTicket = paymentsCount ? Number((totalSpent / paymentsCount).toFixed(2)) : 0;
  const visitedTables = new Set(payments.map((p) => String(p.tableId))).size;

  const spendByBusiness = new Map();
  for (const payment of payments) {
    const table = tableById.get(String(payment.tableId));
    if (!table) {
      continue;
    }
    const businessId = String(table.businessId);
    const current = spendByBusiness.get(businessId) || 0;
    spendByBusiness.set(businessId, current + (Number(payment.amount) || 0));
  }

  let favoriteBusiness = null;
  for (const [businessId, spent] of spendByBusiness.entries()) {
    if (!favoriteBusiness || spent > favoriteBusiness.totalSpent) {
      const business = businessById.get(businessId);
      favoriteBusiness = {
        id: businessId,
        name: business?.name || null,
        slug: business?.slug || null,
        totalSpent: Number(spent.toFixed(2)),
      };
    }
  }

  return {
    rangeDays,
    totals: {
      paymentsCount,
      totalSpent: Number(totalSpent.toFixed(2)),
      averageTicket,
    },
    tables: {
      visited: visitedTables,
    },
    favoriteBusiness,
  };
}

async function getMyProfile(userId) {
  const user = await User.findById(String(userId)).select("_id name username email avatarDataUrl").lean();
  if (!user) {
    throw appError("Usuario no encontrado", 404, "NOT_FOUND");
  }

  return {
    id: user._id.toString(),
    name: user.name,
    username: user.username,
    email: user.email || null,
    avatarDataUrl: user.avatarDataUrl || null,
  };
}

async function updateMyAvatar(userId, avatarDataUrl) {
  const user = await User.findById(String(userId));
  if (!user) {
    throw appError("Usuario no encontrado", 404, "NOT_FOUND");
  }

  user.avatarDataUrl = avatarDataUrl || null;
  await user.save();

  return {
    id: user._id.toString(),
    avatarDataUrl: user.avatarDataUrl || null,
    updatedAt: user.updatedAt,
  };
}

async function getMyActiveTableAsParticipant(userId) {
  const [entry] = await Participant.aggregate([
    { $match: { userId: asObjectId(userId, "userId") } },
    { $sort: { updatedAt: -1 } },
    {
      $lookup: {
        from: "tables",
        localField: "tableId",
        foreignField: "_id",
        as: "table",
      },
    },
    { $unwind: "$table" },
    { $match: { "table.status": "OPEN" } },
    {
      $lookup: {
        from: "businesses",
        localField: "table.businessId",
        foreignField: "_id",
        as: "business",
      },
    },
    { $unwind: { path: "$business", preserveNullAndEmptyArrays: true } },
    { $limit: 1 },
  ]);

  if (!entry) {
    return null;
  }

  const participantRef = {
    _id: entry._id,
    userId: entry.userId || null,
  };

  const participantToken = signParticipantToken({ participant: participantRef, tableId: entry.table._id });

  return {
    mode: "participant",
    participant: {
      id: entry._id.toString(),
      name: entry.name,
    },
    token: participantToken,
    tokenType: "participant",
    table: {
      id: entry.table._id.toString(),
      label: entry.table.label,
      status: entry.table.status,
      qrCode: entry.table.qrCode,
      businessId: entry.table.businessId ? entry.table.businessId.toString() : null,
      businessName: entry.business?.name || null,
    },
  };
}

async function resolveStaffBusinessFilter(userId, role, businessId) {
  if (businessId != null && businessId !== "") {
    const normalizedBusinessId = String(businessId);
    if (!mongoose.Types.ObjectId.isValid(normalizedBusinessId)) {
      throw appError("businessId inválido", 400, "VALIDATION");
    }

    if (role === USER_ROLES.EMPLOYEE) {
      const hasAccess = await userHasAccessToBusiness(String(userId), role, normalizedBusinessId);
      if (!hasAccess) {
        throw appError("Sin acceso a este negocio", 403, "FORBIDDEN");
      }
    }

    return [new mongoose.Types.ObjectId(normalizedBusinessId)];
  }

  if (role === USER_ROLES.ADMIN) {
    return null;
  }

  if (role === USER_ROLES.EMPLOYEE) {
    const links = await StaffAssignment.find({ userId: asObjectId(userId, "userId") })
      .select("businessId")
      .lean();

    if (!links.length) {
      return [];
    }

    return links
      .map((link) => link.businessId)
      .filter(Boolean)
      .map((id) => new mongoose.Types.ObjectId(String(id)));
  }

  return [];
}

async function getMyActiveTableAsStaff({ userId, role, businessId }) {
  const businessFilter = await resolveStaffBusinessFilter(userId, role, businessId);
  if (Array.isArray(businessFilter) && businessFilter.length === 0) {
    return null;
  }

  const tableMatch = { status: "OPEN" };
  if (Array.isArray(businessFilter)) {
    tableMatch.businessId = { $in: businessFilter };
  }

  const [entry] = await Table.aggregate([
    { $match: tableMatch },
    {
      $lookup: {
        from: "businesses",
        localField: "businessId",
        foreignField: "_id",
        as: "business",
      },
    },
    { $unwind: "$business" },
    { $match: { "business.active": true } },
    { $sort: { updatedAt: -1 } },
    { $limit: 1 },
  ]);

  if (!entry) {
    return null;
  }

  return {
    mode: "staff",
    table: {
      id: entry._id.toString(),
      label: entry.label,
      status: entry.status,
      qrCode: entry.qrCode,
      businessId: entry.businessId ? entry.businessId.toString() : null,
      businessName: entry.business?.name || null,
    },
  };
}

async function getMyActiveTable(authContext, query = {}) {
  if (!authContext || authContext.type !== "user" || !authContext.userId) {
    throw appError("Se requiere usuario autenticado", 403, "FORBIDDEN");
  }

  const role = authContext.role || USER_ROLES.CUSTOMER;

  if (role === USER_ROLES.CUSTOMER) {
    return getMyActiveTableAsParticipant(authContext.userId);
  }

  if (role === USER_ROLES.ADMIN || role === USER_ROLES.EMPLOYEE) {
    return getMyActiveTableAsStaff({
      userId: authContext.userId,
      role,
      businessId: query.businessId,
    });
  }

  return null;
}

module.exports = {
  listMyPaymentHistory,
  getMyStats,
  getMyProfile,
  updateMyAvatar,
  getMyActiveTable,
};
