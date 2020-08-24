const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const User = require('../../models/Users');
const gravatar = require('gravatar');
const bcryptjs = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('config');

/**
 * @route POST api/user
 * @description Register User
 * @access Public
 */
router.post(
    '/',
    [
        check('name', 'Name is required').not().isEmpty(),
        check('email', 'Please include a valid email').isEmail(),
        check('password', 'Please enter a valid password').isLength({ min: 6 }),
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                errors: errors.array(),
            });
        }

        //See if user exists
        const { name, email, password } = req.body;
        try {
            let user = await User.findOne({ email });
            if (user) {
                return res.status(400).json({
                    errors: [
                        {
                            success: false,
                            msg: 'User already exists',
                        },
                    ],
                });
            }

            //Get Users Gravatar
            const avatar = await gravatar.url(email, {
                s: '200',
                r: 'pg',
                d: 'mm',
            });

            //Create a new instance of User
            user = new User({
                name,
                email,
                avatar,
                password,
            });

            //Encrypt the password with bcrypt
            const salt = await bcryptjs.genSalt(10);
            user.password = await bcryptjs.hash(password, salt);
            await user.save();

            //Return the token
            const payload = {
                user: {
                    id: user.id,
                },
            };
            jwt.sign(
                payload,
                config.get('JWT_SECRET'),
                {
                    expiresIn: 3600,
                },
                (err, token) => {
                    if (err) {
                        throw err;
                    }
                    return res.json({ token });
                }
            );
        } catch (err) {
            console.error(err.message);
            return res
                .status(500)
                .json({ success: false, message: 'Server Error!!' });
        }
    }
);

module.exports = router;
