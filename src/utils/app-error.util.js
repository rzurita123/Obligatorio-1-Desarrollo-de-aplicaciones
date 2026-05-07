function appError(message, status = 400, code = "BUSINESS_RULE") {
  const err = new Error(message);
  err.status = status;
  err.code = code;
  return err;
}

module.exports = { appError };
