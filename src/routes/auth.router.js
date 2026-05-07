const express = require("express");
const { postAuthSignup, postAuthLogin } = require("../controllers/auth.controller");
const payloadMiddleware = require("../middlewares/payload.middleware");
const { signupSchema, loginSchema } = require("./validations/auth.validation");

const authRouter = express.Router();

authRouter.post("/signup", payloadMiddleware(signupSchema), postAuthSignup);
authRouter.post("/login", payloadMiddleware(loginSchema), postAuthLogin);

module.exports = authRouter;
