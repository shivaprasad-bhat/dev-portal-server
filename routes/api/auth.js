const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const User = require('../../models/Users');
const { check, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const config = require('config');
const bcryptjs = require('bcryptjs');

/**
 * @route GET api/auth
 * @description Authorization
 * @access Public
 */
router.get('/', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        res.json({ user });
    } catch (err) {
        console.log(err.message);
        res.status(500).json({ msg: 'Server Error' });
    }
});

/**
 * @route POST api/auth
 * @description Authenticate user and get token
 * @access Public
 */
router.post(
    '/',
    [
        check('email', 'Please include a valid email').isEmail(),
        check('password', 'Password is required').exists(),
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                errors: errors.array(),
            });
        }

        //See if user exists
        const { email, password } = req.body;
        try {
            let user = await User.findOne({ email });
            if (!user) {
                return res.status(400).json({
                    errors: [
                        {
                            success: false,
                            msg: 'Invalid Credentials',
                        },
                    ],
                });
            }

            const isMatch = await bcryptjs.compare(password, user.password);

            if (!isMatch) {
                return res.status(400).json({
                    errors: [
                        {
                            success: false,
                            msg: 'Invalid Credentials',
                        },
                    ],
                });
            }

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
