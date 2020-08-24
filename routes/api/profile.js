const express = require('express');
const router = express.Router();
const Profile = require('../../models/Profile');
const User = require('../../models/Users');
const auth = require('../../middleware/auth');
const { check, validationResult } = require('express-validator');

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
    } catch (err) {
        console.log(err.message);
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
                        useFindAndModify: false,
                    }
                );
                return res.json({ profile });
            }

            //Create profile
            profile = new Profile(profileFields);
            await profile.save();
            res.json(profile);
        } catch (err) {
            console.log(err.message);
            res.status(500).json({ msg: 'Server Error' });
        }
    }
);

module.exports = router;
