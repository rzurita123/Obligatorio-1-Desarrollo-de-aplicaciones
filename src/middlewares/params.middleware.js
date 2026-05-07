const paramsMiddleware = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.params, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const err = new Error("Validation error");
      err.status = 400;
      err.code = "VALIDATION";
      err.details = error.details.map((detail) => detail.message);
      return next(err);
    }

    req.params = value;
    next();
  };
};

module.exports = paramsMiddleware;
