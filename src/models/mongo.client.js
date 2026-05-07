const mongoose = require("mongoose");
const config = require("../config");

const connectMongoDB = async () => {
  const uri = config.mongo.uri;
  const dbName = config.mongo.dbName;

  if (!uri) {
    throw new Error("MONGODB_CONNECTION_STRING no está definida");
  }

  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 10000,
    dbName,
  });
};

module.exports = connectMongoDB;
