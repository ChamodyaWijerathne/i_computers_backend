import express from "express";
import { createProduct, deleteProduct, getProductById, getProducts,searchProducts,updateProduct } from "../controllers/productController.js";
import { createReview, getReviews, updateReview, deleteReview } from "../controllers/reviewController.js";

const productRouter = express.Router();
productRouter.post("/", createProduct);
productRouter.get("/", getProducts);
productRouter.get("/search/:query", searchProducts)
productRouter.delete("/:productId", deleteProduct);
productRouter.put("/:productId", updateProduct);
productRouter.get("/:productId", getProductById)

// Reviews
productRouter.post("/:productId/reviews", createReview);
productRouter.get("/:productId/reviews", getReviews);
productRouter.put("/:productId/reviews/:reviewId", updateReview);
productRouter.delete("/:productId/reviews/:reviewId", deleteReview);

export default productRouter;