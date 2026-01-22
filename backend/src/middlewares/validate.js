// backend/src/middlewares/validate.js
export function validate(schema) {
  return (req, res, next) => {
    try {
      const data = {
        body: req.body,
        query: req.query,
        params: req.params
      };
      schema.parse(data);
      next();
    } catch (e) {
      return res.status(400).json({
        error: "Input tidak valid",
        details: e.errors?.map(er => er.message) ?? []
      });
    }
  };
}
