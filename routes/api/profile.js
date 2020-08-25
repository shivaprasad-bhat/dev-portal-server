const express = require('express');
const router = express.Router();
const Profile = require('../../models/Profile');
const User = require('../../models/Users');
const auth = require('../../middleware/auth');
const { check, validationResult } = require('express-validator');
const request = require('request');
const config = require('config');
require('colors');
/**
 * @route GET api/profile/me
 * @description Get current user's profile
 * @access Private
 */
router.get('/me', auth, async (req, res) => {
    try {
        const profile = await Profile.findOne({
            user: req.user.id,
        }).populate('user', ['name', 'avatar']);

        if (!profile) {
            return res.status(400).json({ msg: 'Profile not found' });
        }

        res.json({ profile });
    } catch (error) {
        console.log(error.message);
        res.status(500).json({ msg: 'Server Error' });
    }
});

/**
 * @route POST api/profile/
 * @description Create or update a user profile
 * @access Private
 */

router.post(
    '/',
    [
        auth,
        [
            check('status', 'Status is required').not().isEmpty(),
            check('skills', 'Skills are required').not().isEmpty(),
        ],
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        const {
            company,
            website,
            bio,
            status,
            githubusername,
            skills,
            youtube,
            facebook,
            twitter,
            instagram,
        } = req.body;

        //Build profile Object
        const profileFields = {};
        profileFields.user = req.user.id;
        if (company) profileFields.company = company;
        if (website) profileFields.website = website;
        if (bio) profileFields.bio = bio;
        if (status) profileFields.status = status;
        if (githubusername) profileFields.githubusername = githubusername;
        if (skills) {
            profileFields.skills = skills
                .split(',')
                .map((skill) => skill.trim());
        }
        //Build social array
        profileFields.social = {};
        if (facebook) profileFields.social.facebook = facebook;
        if (twitter) profileFields.social.twitter = twitter;
        if (instagram) profileFields.social.instagram = instagram;
        if (youtube) profileFields.social.youtube = youtube;
        try {
            let profile = await Profile.findOne({ user: req.user.id });
            if (profile) {
                //Update profile
                profile = await Profile.findOneAndUpdate(
                    { user: req.user.id },
                    { $set: profileFields },
                    {
                        new: true,
                    }
                );
                return res.json({ profile });
            }

            //Create profile
            profile = new Profile(profileFields);
            await profile.save();
            res.json(profile);
        } catch (error) {
            console.log(error.message);
            res.status(500).json({ msg: 'Server Error' });
        }
    }
);

/**
 * @route GET api/profile/
 * @description Get all Profile
 * @access Public
 */

router.get('/', async (req, res) => {
    try {
        const profile = await Profile.find().populate('user', [
            'name',
            'avatar',
        ]);
        res.json(profile);
    } catch (error) {
        console.log(error.message);
        res.status(500).json({ msg: 'Server Error' });
    }
});

/**
 * @route GET api/profile/user/:user_id
 * @description Get  Profile by user id
 * @access Public
 */

router.get('/user/:user_id', async (req, res) => {
    try {
        const profile = await Profile.findOne({
            user: req.params.user_id,
        }).populate('user', ['name', 'avatar']);
        res.json(profile);
        if (!profile) {
            return res.status(400).json({ msg: 'No profile found' });
        }
    } catch (error) {
        if (error.kind == 'ObjectId')
            return res.status(400).json({ msg: 'No profile found' });
        res.status(500).json({ msg: 'Server Error' });
    }
});

/**
 * @route DELETE api/profile/
 * @description Delete Profile, User and Post
 * @access Private
 */

router.delete('/', auth, async (req, res) => {
    try {
        /**
         * @todo remove users post
         */
        await Profile.findOneAndRemove({ user: req.user.id });
        await User.findOneAndRemove({ _id: req.user.id });

        res.json({ msg: 'User removed' });
    } catch (error) {
        console.log(error.message);
        res.status(500).json({ msg: 'Server Error' });
    }
});

/**
 * @route PUT api/profile/experience
 * @description Add profile experience
 * @access Private
 */
router.put(
    '/experience',
    [
        auth,
        [
            check('title', 'Title is required').not().isEmpty(),
            check('company', 'Company is required').not().isEmpty(),
            check('from', 'From Date is required').not().isEmpty(),
        ],
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        const {
            title,
            company,
            location,
            from,
            to,
            current,
            description,
        } = req.body;

        const newExp = {
            title,
            company,
            location,
            from,
            to,
            current,
            description,
        };

        try {
            const profile = await Profile.findOne({ user: req.user.id });
            profile.experience.unshift(newExp);
            await profile.save();
            return res.json(profile);
        } catch (error) {
            console.log(error.message);
            res.status(500).json({ msg: 'Server Error' });
        }
    }
);

/**
 * @route DELETE api/profile/experience
 * @description Delete profile experience
 * @access Private
 */
router.delete('/experience/:exp_id', auth, async (req, res) => {
    try {
        const profile = await Profile.findOne({ user: req.user.id });

        //Get the remove index
        const removeIndex = profile.experience
            .map((item) => item.id)
            .indexOf(req.params.exp_id);

        profile.experience.splice(removeIndex, 1);

        await profile.save();
        return res.json(profile);
    } catch (error) {
        console.log(error.message);
        res.status(500).json({ msg: 'Server Error' });
    }
});

//Add and delete education
/**
 * @route PUT api/profile/education
 * @description Add profile education
 * @access Private
 */
router.put(
    '/education',
    [
        auth,
        [
            check('school', 'School is required').not().isEmpty(),
            check('degree', 'Degree is required').not().isEmpty(),
            check('from', 'From Date is required').not().isEmpty(),
            check('fieldofstudy', 'Field of Study is required').not().isEmpty(),
        ],
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        const {
            school,
            degree,
            fieldofstudy,
            from,
            to,
            current,
            description,
        } = req.body;

        const newEdu = {
            school,
            degree,
            fieldofstudy,
            from,
            to,
            current,
            description,
        };

        try {
            const profile = await Profile.findOne({ user: req.user.id });
            profile.education.unshift(newEdu);
            await profile.save();
            return res.json(profile);
        } catch (error) {
            console.log(error.message);
            res.status(500).json({ msg: 'Server Error' });
        }
    }
);

/**
 * @route DELETE api/profile/education
 * @description Delete profile education
 * @access Private
 */
router.delete('/education/:edu_id', auth, async (req, res) => {
    try {
        const profile = await Profile.findOne({ user: req.user.id });

        //Get the remove index
        const removeIndex = profile.education
            .map((item) => item.id)
            .indexOf(req.params.edu_id);

        profile.education.splice(removeIndex, 1);

        await profile.save();
        return res.json(profile);
    } catch (error) {
        console.log(error.message);
        res.status(500).json({ msg: 'Server Error' });
    }
});

/**
 * @route GET api/profile/github/:username
 * @description Get user repos from github
 * @access Public
 */
router.get('/github/:username', (req, res) => {
    try {
        const options = {
            uri: `https://api.github.com/users/${
                req.params.username
            }/repos?per_page=5&sort=created:asc&client_id=${config.get(
                'githubClientId'
            )}&client_secret=${config.get('githubSecret')}
            )}`,
            method: 'GET',
            headers: { 'user-agent': 'node.js' },
        };
        request(options, (err, response, body) => {
            if (err) {
                console.log(`${err.message}`.red);
            }

            if (response.statusCode !== 200) {
                return res.status(404).json({
                    msg: 'No Github Profile Found',
                });
            }
            return res.json(JSON.parse(body));
        });
    } catch (error) {
        console.log(error.message);
        res.status(500).json({ msg: 'Server Error' });
    }
});

module.exports = router;
