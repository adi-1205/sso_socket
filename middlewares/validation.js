const { check } = require('express-validator');

const usernameValidation = check('username')
    .exists()
    .withMessage('Username is required')
    .notEmpty()
    .withMessage('Username should not be empty')
    .trim()
    .isLength({ min: 3, max: 20 })
    .withMessage('Username must be between 3 and 20 characters long')
    .matches(/^[a-zA-Z0-9_]*$/)
    .withMessage('Username can only contain letters, numbers, and underscores');

const emailValidation = check('email')
    .exists()
    .withMessage('Email is required')
    .notEmpty()
    .withMessage('Email should not be empty')
    .trim()
    .isEmail()
    .withMessage('Email must be valid');

const passwordValidation = check('password')
    .exists()
    .withMessage('Password is required')
    .notEmpty()
    .withMessage('Password should not be empty')
    .trim()
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .isStrongPassword({
        minLength: 8,
        minLowercase: 1,
        minUppercase: 1,
        minNumbers: 1,
        minSymbols: 1,
    })
    .withMessage('Weak Password, add atleast 1 lowercase, 1 uppercase, 1 symbol');



module.exports.validateRegister = () => [usernameValidation, emailValidation, passwordValidation,]