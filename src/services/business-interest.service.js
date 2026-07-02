const { BusinessInterest } = require("../models");

async function createBusinessInterest({ name, email, contact }) {
  const doc = await BusinessInterest.create({
    name: String(name).trim(),
    email: String(email).trim().toLowerCase(),
    contact: String(contact).trim(),
  });

  return {
    id: doc._id.toString(),
    name: doc.name,
    email: doc.email,
    contact: doc.contact,
    createdAt: doc.createdAt,
  };
}

module.exports = {
  createBusinessInterest,
};
