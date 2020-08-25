const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const auth = require('../../middleware/auth');
const Users = require('../../models/Users');
const Profile = require('../../models/Profile');
const Posts = require('../../models/Posts');
require('colors');

/**
 * @route POST api/posts
 * @description Create a post
 * @access Private
 */
router.post(
    '/',
    [auth, [check('text', 'Text is required').not().isEmpty()]],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            const user = await Users.findById(req.user.id).select('-password');
            const newPost = new Posts({
                text: req.body.text,
                name: user.name,
                avatar: user.avatar,
                user: req.user.id,
            });
            const post = await newPost.save();
            res.json(post);
        } catch (error) {
            console.log(`${error.message}.red`);
            res.status(500).json({ msg: 'Server Error' });
        }
    }
);

/**
 * @route GET api/posts
 * @description Get All Posts
 * @access Private
 */
router.get('/', auth, async (req, res) => {
    try {
        const posts = await Posts.find().sort({ date: -1 });
        return res.json(posts);
    } catch (error) {
        console.log(`${error.message}.red`);
        return res.status(500).json({ msg: 'Server Error' });
    }
});

/**
 * @route GET api/posts/:id
 * @description Get Single post by id
 * @access Private
 */
router.get('/:id', auth, async (req, res) => {
    try {
        const post = await Posts.findById(req.params.id);
        if (!post) {
            return res.status(404).json({ msg: 'Post not found' });
        }
        return res.json(post);
    } catch (error) {
        console.log(`${error.message}.red`);
        if (error.kind === 'ObjectId') {
            return res.status(404).json({ msg: 'Post not found' });
        }
        res.status(500).json({ msg: 'Server Error' });
    }
});

/**
 * @route DELETE api/posts/:id
 * @description Delete Single post by id
 * @access Private
 */
router.delete('/:id', auth, async (req, res) => {
    try {
        const post = await Posts.findById(req.params.id);
        //Check on user
        if (!post) {
            return res.status(400).json({ msg: 'Post not found' });
        }
        if (String(post.user) !== String(req.user.id)) {
            return res
                .status(401)
                .json({ msg: 'User not authorised to delete' });
        }
        await post.remove();
        res.json({ msg: 'Post removed' });
    } catch (error) {
        console.log(`${error.message}`.red);
        if (error.kind === 'ObjectId') {
            return res.status(404).json({ msg: 'Post not found' });
        }
        res.status(500).json({ msg: 'Server Error' });
    }
});

/**
 * @route PUT api/posts/like/:id
 * @description Like a post
 * @access Private
 */

router.put('/like/:id', auth, async (req, res) => {
    try {
        const post = await Posts.findById(req.params.id);

        if (
            post.likes.filter(
                (like) => like.user.toString() === String(req.user.id)
            ).length > 0
        ) {
            return res.status(400).json({ msg: 'Post already liked' });
        }

        post.likes.unshift({ user: req.user.id });
        await post.save();
        return res.json({ like: post.likes });
    } catch (error) {
        console.log(`${error.message}`.red);
        res.status(500).json({ msg: 'Server Error' });
    }
});

/**
 * @route PUT api/posts/unlike/:id
 * @description Unlike a post
 * @access Private
 */

router.put('/unlike/:id', auth, async (req, res) => {
    try {
        const post = await Posts.findById(req.params.id);

        if (
            post.likes.filter(
                (like) => like.user.toString() === String(req.user.id)
            ).length === 0
        ) {
            return res.status(400).json({ msg: 'Post has not yet been liked' });
        }

        //Get the remove index
        const removeIndex = post.likes
            .map((like) => like.user.toString())
            .indexOf(req.user.id);
        post.likes.splice(removeIndex, 1);
        await post.save();
        return res.json({ like: post.likes });
    } catch (error) {
        console.log(`${error.message}`.red);
        res.status(500).json({ msg: 'Server Error' });
    }
});

/**
 * @route POST api/posts/comment/:id
 * @description Create a comment
 * @access Private
 */
router.post(
    '/comment/:id',
    [auth, [check('text', 'Text is required').not().isEmpty()]],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            const user = await Users.findById(req.user.id).select('-password');
            const post = await Posts.findById(req.params.id);

            const newComment = {
                text: req.body.text,
                name: user.name,
                avatar: user.avatar,
                user: req.user.id,
            };

            post.comments.unshift(newComment);
            await post.save();
            res.json(post.comments);
        } catch (error) {
            console.log(`${error.message}.red`);
            res.status(500).json({ msg: 'Server Error' });
        }
    }
);

/**
 * @route DELETE api/posts/comment/:id/:comment_id
 * @description Delete a comment
 * @access Private
 */
router.delete('/comment/:id/:comment_id', auth, async (req, res) => {
    try {
        const post = await Posts.findById(req.params.id);
        //Pull the comments
        const comment = post.comments.find(
            (comment) => comment.id === req.params.comment_id
        );
        //Make sure comment exists
        if (!comment) {
            return res.status(404).json({ msg: 'Comment not found' });
        }
        //Deleting the comments
        if (comment.user.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'User not authoried' });
        }
        //Get the remove index
        const removeIndex = post.comments
            .map((comment) => comment.user.toString())
            .indexOf(req.user.id);
        post.comments.splice(removeIndex, 1);
        await post.save();
        return res.json({ comments: post.comments });
    } catch (error) {
        console.log(`${error.message}`.red);
        res.status(500).json({ msg: 'Server Error' });
    }
});

module.exports = router;
