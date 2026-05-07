const payloadMiddleware = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const err = new Error("Error de validación en el body");
      err.status = 400;
      err.code = "VALIDATION";
      err.details = error.details.map((detail) => detail.message);
      return next(err);
    }

    req.body = value;
    next();
  };
};

module.exports = payloadMiddleware;
