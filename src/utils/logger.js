const format = (level, msg, meta) => {
  const ts = new Date().toISOString();
  const extra = meta !== undefined ? ` ${JSON.stringify(meta)}` : "";
  return `[${ts}] ${level.toUpperCase()}: ${msg}${extra}`;
};

module.exports = {
  info: (msg, meta) => console.log(format("info", msg, meta)),
  warn: (msg, meta) => console.warn(format("warn", msg, meta)),
  error: (msg, meta) => console.error(format("error", msg, meta)),
};
