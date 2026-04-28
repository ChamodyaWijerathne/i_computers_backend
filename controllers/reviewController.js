import Review from "../models/review.js";
import Product from "../models/product.js";
import { isAdmin } from "./userController.js";

function mapReviewResponse(review, product) {
    const userName = [review.userFirstName, review.userLastName].filter(Boolean).join(" ").trim();

    return {
        reviewId: review._id.toString(),
        productId: review.productId,
        productName: product?.name || "",
        productImage: product?.images?.[0] || "",
        userEmail: review.userEmail,
        userName: userName,
        userAvatar: review.userImage || "",
        rating: review.rating,
        comment: review.comment,
        createdAt: review.createdAt,
        updatedAt: review.updatedAt,
    };
}

function isValidRating(rating) {
    return Number.isInteger(rating) && rating >= 1 && rating <= 5;
}

function isValidComment(comment) {
    return comment == null || (typeof comment === "string" && comment.length <= 500);
}

export async function createReview(req, res) {
    if (req.user == null) {
        res.status(401).json({ message: "Unauthorized. Please login to post a review." });
        return;
    }

    try {
        const productId = req.params.productId;
        const product = await Product.findOne({ productId: productId });
        if (product == null) {
            res.status(404).json({ message: "Product not found" });
            return;
        }

        const rating = Number(req.body.rating);
        const comment = req.body.comment ?? "";

        if (rating == null) {
            res.status(400).json({ message: "Rating is required" });
            return;
        }

        if (!isValidRating(rating)) {
            res.status(400).json({ message: "Rating must be an integer from 1 to 5" });
            return;
        }

        if (!isValidComment(comment)) {
            res.status(400).json({ message: "Comment must be 500 characters or fewer" });
            return;
        }

        const review = new Review({
            productId: productId,
            userEmail: req.user.email,
            userFirstName: req.user.firstName,
            userLastName: req.user.lastName,
            userImage: req.user.image,
            rating: rating,
            comment: comment,
        });

        try {
            await review.save();
            res.status(201).json({ message: "Review created successfully", review: mapReviewResponse(review, product) });
        } catch (err) {
            // handle duplicate review (unique index)
            if (err && err.code === 11000) {
                res.status(400).json({ message: "You already reviewed this product" });
                return;
            }
            throw err;
        }
    } catch (error) {
        res.status(500).json({ message: "Error creating review", error: error.message });
    }
}

export async function getReviews(req, res) {
    try {
        const productId = req.params.productId;
        const product = await Product.findOne({ productId: productId });
        if (product == null) {
            res.status(404).json({ message: "Product not found" });
            return;
        }

        const reviews = await Review.find({ productId: productId }).sort({ createdAt: -1 });
        res.status(200).json(reviews.map((review) => mapReviewResponse(review, product)));
    } catch (error) {
        res.status(500).json({ message: "Error fetching reviews", error: error.message });
    }
}

export async function getMyReviews(req, res) {
    if (req.user == null) {
        res.status(401).json({ message: "Unauthorized. Please login to view your reviews." });
        return;
    }

    try {
        const reviews = await Review.find({ userEmail: req.user.email }).sort({ createdAt: -1 });
        const productIds = [...new Set(reviews.map((review) => review.productId))];
        const products = await Product.find({ productId: { $in: productIds } });
        const productMap = new Map(products.map((product) => [product.productId, product]));

        res.status(200).json(
            reviews.map((review) => mapReviewResponse(review, productMap.get(review.productId)))
        );
    } catch (error) {
        res.status(500).json({ message: "Error fetching your reviews", error: error.message });
    }
}

export async function updateReview(req, res) {
    if (req.user == null) {
        res.status(401).json({ message: "Unauthorized. Please login to update a review." });
        return;
    }

    try {
        const productId = req.params.productId;
        const reviewId = req.params.reviewId;
        const product = await Product.findOne({ productId: productId });
        if (product == null) {
            res.status(404).json({ message: "Product not found" });
            return;
        }
        const review = await Review.findOne({ _id: reviewId, productId: productId });
        if (review == null) {
            res.status(404).json({ message: "Review not found" });
            return;
        }

        // Only the original review author (customer) may update their review.
        // Admins are explicitly not allowed to edit reviews.
        if (req.user.role === "admin") {
            res.status(403).json({ message: "Forbidden. Admin users cannot edit reviews." });
            return;
        }

        if (req.user.email !== review.userEmail) {
            res.status(403).json({ message: "Forbidden. Only the review author can edit this review." });
            return;
        }

        if (req.body.rating != null) {
            const rating = Number(req.body.rating);
            if (!isValidRating(rating)) {
                res.status(400).json({ message: "Rating must be an integer from 1 to 5" });
                return;
            }
            review.rating = rating;
        }

        if (req.body.comment != null) {
            if (!isValidComment(req.body.comment)) {
                res.status(400).json({ message: "Comment must be 500 characters or fewer" });
                return;
            }
            review.comment = req.body.comment;
        }

        await review.save();
        res.status(200).json({ message: "Review updated successfully", review: mapReviewResponse(review, product) });
    } catch (error) {
        res.status(500).json({ message: "Error updating review", error: error.message });
    }
}

export async function deleteReview(req, res) {
    if (req.user == null) {
        res.status(401).json({ message: "Unauthorized. Please login to delete a review." });
        return;
    }

    try {
        const productId = req.params.productId;
        const reviewId = req.params.reviewId;
        const product = await Product.findOne({ productId: productId });
        if (product == null) {
            res.status(404).json({ message: "Product not found" });
            return;
        }
        const review = await Review.findOne({ _id: reviewId, productId: productId });
        if (review == null) {
            res.status(404).json({ message: "Review not found" });
            return;
        }

        // Only the original review author (customer) may delete their review.
        // Admins are explicitly not allowed to delete reviews.
        if (req.user.role === "admin") {
            res.status(403).json({ message: "Forbidden. Admin users cannot delete reviews." });
            return;
        }

        if (req.user.email !== review.userEmail) {
            res.status(403).json({ message: "Forbidden. Only the review author can delete this review." });
            return;
        }

        await Review.deleteOne({ _id: reviewId });
        res.status(200).json({ message: "Review deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Error deleting review", error: error.message });
    }
}
