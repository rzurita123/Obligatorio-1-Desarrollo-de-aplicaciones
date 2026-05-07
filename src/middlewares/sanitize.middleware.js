function sanitizeValue(value) {
  if (Array.isArray(value)) {
    return value.map(sanitizeValue);
  }

  if (value && typeof value === "object") {
    const safe = {};
    for (const [key, nested] of Object.entries(value)) {
      // Evita operator/path injection en objetos de entrada.
      if (key.startsWith("$") || key.includes(".")) {
        continue;
      }
      safe[key] = sanitizeValue(nested);
    }
    return safe;
  }

  return value;
}

function sanitizeMiddleware(req, _res, next) {
  if (req.body && typeof req.body === "object") {
    req.body = sanitizeValue(req.body);
  }

  if (req.query && typeof req.query === "object") {
    req.query = sanitizeValue(req.query);
  }

  if (req.params && typeof req.params === "object") {
    req.params = sanitizeValue(req.params);
  }

  next();
}

module.exports = sanitizeMiddleware;
