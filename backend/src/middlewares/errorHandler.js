// backend/src/middlewares/errorHandler.js
export function errorHandler(err, req, res, next) {
  console.error(err);

  if (err.status) {
    return res.status(err.status).json({ error: err.message });
  }

  res.status(500).json({ error: "Terjadi kesalahan di server" });
}
