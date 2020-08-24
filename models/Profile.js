const mongoose = require('mongoose');
const ProfileSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
    },
    company: {
        type: String,
    },
    website: {
        type: String,
    },
    location: {
        type: String,
    },
    status: {
        type: String,
        required: true,
    },
    skills: {
        type: [String],
    },
    bio: {
        type: String,
    },
    githubusername: {
        type: String,
    },
    experience: [
        {
            title: {
                type: String,
                required: true,
            },
            company: {
                type: String,
                required: true,
            },
            location: String,
            from: {
                type: Date,
                required: true,
            },
            to: Date,
            current: {
                type: Boolean,
                default: false,
            },
            description: String,
        },
    ],
    education: [
        {
            school: {
                type: String,
                required: true,
            },
            degree: {
                type: String,
                required: true,
            },
            fieldofstudy: {
                type: String,
                required: true,
            },
            from: {
                type: Date,
                required: true,
            },
            to: Date,
            current: {
                type: Boolean,
                default: false,
            },
            description: String,
        },
    ],
    social: {
        facebook: String,
        instagram: String,
        twitter: String,
        youtube: String,
    },
    date: {
        type: Date,
        default: Date.now,
    },
});

module.exports = Profile = mongoose.model('profile', ProfileSchema);
