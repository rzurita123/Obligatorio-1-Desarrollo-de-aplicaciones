const express = require("express");
const { postAuthSignup } = require("../controllers/auth.controller");
const payloadMiddleware = require("../middlewares/payload.middleware");
const { signupSchema } = require("./validations/auth.validation");

const router = express.Router();

router.post("/", payloadMiddleware(signupSchema), postAuthSignup);

module.exports = router;
