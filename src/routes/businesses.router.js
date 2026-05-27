const express = require("express");
const authenticate = require("../middlewares/authenticate.middleware");
const { requirePlatformUser } = require("../middlewares/access-business.middleware");
const { getAccessibleBusinesses } = require("../controllers/businesses.controller");

const router = express.Router();

router.get("/", authenticate, requirePlatformUser, getAccessibleBusinesses);

module.exports = router;
