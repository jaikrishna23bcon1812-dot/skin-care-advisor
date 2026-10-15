const mongoose = require("mongoose");

const comparisonSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    title: {
        type: String,
        default: "My Skin Journey"
    },
    beforeImage: {
        type: String,
        required: true
    },
    afterImage: {
        type: String,
        required: true
    },
    beforeDate: {
        type: String,
        required: true
    },
    afterDate: {
        type: String,
        required: true
    },
    notes: {
        type: String,
        default: ""
    }
}, { timestamps: true });

module.exports = mongoose.model("Comparison", comparisonSchema);