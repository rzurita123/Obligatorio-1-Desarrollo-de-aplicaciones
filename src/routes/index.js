//Rutas de la API, autenticacion, tablas, items, pagos, usuarios.
const authRouter = require("./auth.router");
const tablesRouter = require("./tables.router");
const itemsRouter = require("./items.router");
const paymentsRouter = require("./payments.router");
const usersRouter = require("./users.router");
const { sendSuccess } = require("../utils/response.util");

function mountRoutes(app) {
  app.get("/", (_req, res) => {
    return sendSuccess(res, 200, {
      name: "MesaPay API",
      message:
        "Si estás leyendo esto, MesaPay API está funcionando :).",
    });
  });
  app.use("/auth", authRouter);
  app.use("/tables", tablesRouter);
  app.use("/items", itemsRouter);
  app.use("/payments", paymentsRouter);
  app.use("/users", usersRouter);
}

module.exports = { mountRoutes };
