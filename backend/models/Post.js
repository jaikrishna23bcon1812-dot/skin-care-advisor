const mongoose = require("mongoose");

const commentSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    userName: { type: String, required: true },
    text: { type: String, required: true, maxlength: 500 },
    createdAt: { type: Date, default: Date.now }
});

const postSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    userName: { type: String, required: true },
    title: {
        type: String,
        required: true,
        maxlength: 100
    },
    concern: {
        type: String,
        required: true,
        maxlength: 200
    },
    routine: {
        type: String,
        required: true,
        maxlength: 5000
    },
    likes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }],
    comments: [commentSchema]
}, { timestamps: true });

module.exports = mongoose.model("Post", postSchema);
