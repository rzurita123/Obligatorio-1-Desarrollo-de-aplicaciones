//Variables que se toman del .env (no subir a git!)
require("dotenv").config();

module.exports = {
  port: Number(process.env.PORT) || 3000,
  nodeEnv: process.env.NODE_ENV || "development",
  mongo: {
    uri: process.env.MONGODB_CONNECTION_STRING || "",
    dbName: process.env.MONGODB_DATABASE_NAME || "mesapay",
  },
  auth: {
    secret: process.env.AUTH_SECRET_KEY || "",
  },
};
