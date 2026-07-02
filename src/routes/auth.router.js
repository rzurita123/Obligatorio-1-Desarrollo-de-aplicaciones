const express = require("express");
const { postAuthSignup, postAuthLogin, postBusinessInterest } = require("../controllers/auth.controller");
const payloadMiddleware = require("../middlewares/payload.middleware");
const { signupSchema, loginSchema, businessInterestSchema } = require("./validations/auth.validation");

const authRouter = express.Router();

authRouter.post("/signup", payloadMiddleware(signupSchema), postAuthSignup);
authRouter.post("/login", payloadMiddleware(loginSchema), postAuthLogin);
authRouter.post("/business-interest", payloadMiddleware(businessInterestSchema), postBusinessInterest);

module.exports = authRouter;
