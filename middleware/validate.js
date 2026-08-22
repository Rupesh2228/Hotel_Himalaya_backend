const { validationResult } = require('express-validator');

/**
 * Shared middleware: reads express-validator results and short-circuits with
 * a 400 response when any rule fails. Import once and reuse across all routes.
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  return next();
};

module.exports = validate;
