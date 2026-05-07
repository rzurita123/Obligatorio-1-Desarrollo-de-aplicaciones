function sendSuccess(res, status, data, meta = undefined) {
  const payload = {
    ok: true,
    data,
  };

  if (meta !== undefined) {
    payload.meta = meta;
  }

  return res.status(status).json(payload);
}

module.exports = {
  sendSuccess,
};
