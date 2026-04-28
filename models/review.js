import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
    {
        productId: {
            type: String,
            required: true,
            index: true
        },
        userEmail: {
            type: String,
            required: true
        },
        userFirstName: {
            type: String
        },
        userLastName: {
            type: String
        },
        userImage: {
            type: String
        },
        rating: {
            type: Number,
            required: true,
            min: 1,
            max: 5
        },
        comment: {
            type: String,
            default: ""
        }
    },
    {
        timestamps: true
    }
);

// prevent a user from creating multiple reviews for the same product
reviewSchema.index({ productId: 1, userEmail: 1 }, { unique: true });

const Review = mongoose.model("Review", reviewSchema);

export default Review;
