//Rutas de la API, autenticacion, tablas, items, pagos, usuarios.
const authRouter = require("./auth.router");
const adminBusinessesRouter = require("./admin-businesses.router");
const businessesRouter = require("./businesses.router");
const tablesRouter = require("./tables.router");
const itemsRouter = require("./items.router");
const paymentsRouter = require("./payments.router");
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
  app.use("/admin/businesses", adminBusinessesRouter);
  app.use("/businesses", businessesRouter);
  app.use("/tables", tablesRouter);
  app.use("/items", itemsRouter);
  app.use("/payments", paymentsRouter);
}

module.exports = { mountRoutes };
