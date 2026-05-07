require("dotenv").config();

require("./models");

const express = require("express");
const morgan = require("morgan");

const corsMiddleware = require("./middlewares/cors.middleware");
const jsonMiddleware = require("./middlewares/json.middleware");
const sanitizeMiddleware = require("./middlewares/sanitize.middleware");
const notFoundMiddleware = require("./middlewares/notFound.middleware");
const errorMiddleware = require("./middlewares/error.middleware");
const { mountRoutes } = require("./routes/index");

const app = express();

app.disable("x-powered-by");

app.use(jsonMiddleware);
app.use(sanitizeMiddleware);
app.use(morgan("dev"));
app.use(corsMiddleware);

mountRoutes(app);

app.use(notFoundMiddleware);
app.use(errorMiddleware);

module.exports = app;
