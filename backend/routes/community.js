const express = require("express");
const router = express.Router();
const Post = require("../models/Post");
const User = require("../models/User");

router.post("/add", async (req, res) => {
    try {
        const { userId, title, concern, routine } = req.body;
        if (!userId || !title || !concern || !routine) {
            return res.status(400).json({ error: "All fields required" });
        }
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }
        const post = await Post.create({
            userId,
            userName: user.name,
            title,
            concern,
            routine
        });
        res.status(201).json({ message: "Post shared!", post });
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: "Server error" });
    }
});

router.get("/posts", async (req, res) => {
    try {
        const posts = await Post.find().sort({ createdAt: -1 }).limit(50);
        res.json({ posts });
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: "Server error" });
    }
});

router.post("/like/:postId", async (req, res) => {
    try {
        const { userId } = req.body;
        const { postId } = req.params;
        if (!userId) {
            return res.status(400).json({ error: "User ID required" });
        }
        const post = await Post.findById(postId);
        if (!post) {
            return res.status(404).json({ error: "Post not found" });
        }
        const index = post.likes.indexOf(userId);
        if (index > -1) {
            post.likes.splice(index, 1);
        } else {
            post.likes.push(userId);
        }
        await post.save();
        res.json({
            message: index > -1 ? "Unliked" : "Liked",
            likes: post.likes.length,
            liked: index === -1
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: "Server error" });
    }
});

router.post("/comment/:postId", async (req, res) => {
    try {
        const { userId, text } = req.body;
        const { postId } = req.params;
        if (!userId || !text) {
            return res.status(400).json({ error: "User ID and comment required" });
        }
        if (text.length > 500) {
            return res.status(400).json({ error: "Comment too long" });
        }
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }
        const post = await Post.findById(postId);
        if (!post) {
            return res.status(404).json({ error: "Post not found" });
        }
        post.comments.push({ userId, userName: user.name, text });
        await post.save();
        res.json({ message: "Comment added", comments: post.comments });
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: "Server error" });
    }
});

router.delete("/post/:postId", async (req, res) => {
    try {
        const { userId } = req.query;
        const { postId } = req.params;
        const post = await Post.findById(postId);
        if (!post) {
            return res.status(404).json({ error: "Post not found" });
        }
        if (post.userId.toString() !== userId) {
            return res.status(403).json({ error: "Can only delete your own posts" });
        }
        await Post.findByIdAndDelete(postId);
        res.json({ message: "Post deleted" });
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: "Server error" });
    }
});

module.exports = router;
