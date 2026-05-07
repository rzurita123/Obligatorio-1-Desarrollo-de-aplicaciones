const queryMiddleware = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.query, {
      abortEarly: false,
      stripUnknown: true,
      convert: true,
    });

    if (error) {
      const err = new Error("Error de validación en la query");
      err.status = 400;
      err.code = "VALIDATION";
      err.details = error.details.map((detail) => detail.message);
      return next(err);
    }

    req.query = value;
    next();
  };
};

module.exports = queryMiddleware;
