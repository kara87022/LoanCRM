const { body, validationResult } = require('express-validator');

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

const validateLoan = [
  body('loan_id').isLength({ min: 1 }).trim().escape(),
  body('customer_name').isLength({ min: 1 }).trim().escape(),
  body('loan_amount').isNumeric(),
  handleValidationErrors
];

const validateUser = [
  body('username').isLength({ min: 3 }).trim().escape(),
  body('password').isLength({ min: 6 }),
  body('role').optional().isIn(['admin', 'employee', 'manager', 'customer']),
  handleValidationErrors
];

const validateLogin = [
  body('username').isLength({ min: 1 }).trim().escape(),
  body('password').isLength({ min: 1 }),
  handleValidationErrors
];

module.exports = { validateLoan, validateUser, validateLogin, handleValidationErrors };