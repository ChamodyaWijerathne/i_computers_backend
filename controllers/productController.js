import { isAdmin } from "./userController.js";
import Product from "../models/product.js";
import Review from "../models/review.js";

async function attachReviewSummary(products) {
    const productList = Array.isArray(products) ? products : [products];
    const productIds = productList.map((product) => product.productId).filter(Boolean);

    if (productIds.length === 0) {
        return Array.isArray(products) ? [] : null;
    }

    const summaries = await Review.aggregate([
        { $match: { productId: { $in: productIds } } },
        {
            $group: {
                _id: "$productId",
                reviewCount: { $sum: 1 },
                averageRating: { $avg: "$rating" },
            },
        },
    ]);

    const summaryMap = new Map(
        summaries.map((summary) => [summary._id, summary])
    );

    const withSummary = productList.map((product) => {
        const summary = summaryMap.get(product.productId) || { reviewCount: 0, averageRating: 0 };
        const averageRating = Number(summary.averageRating || 0);

        return {
            ...product,
            reviewCount: summary.reviewCount || 0,
            averageRating: averageRating,
            ratingCount: summary.reviewCount || 0,
            reviewSummary: {
                reviewCount: summary.reviewCount || 0,
                averageRating: averageRating,
            },
        };
    });

    return Array.isArray(products) ? withSummary : withSummary[0] || null;
}

export async function createProduct(req, res) {

    if(!isAdmin(req)){
        res.status(403).json(
            {
                message: "Access denied. Admins only"
            }
        )
        return
    }

    try{

       const existingProduct =  await Product.findOne({
            productId: req.body.productId
       }) 

       if(existingProduct){
            res.status(400).json(
                {
                    message: "Product with this productId already exists"
                }
            )
            return
       }

       const data = {}

       data.productId = req.body.productId

       if(req.body.name == null) {
        res.status(400).json(
            {
                message: "Product name is required"
            }
        )
        return;
       }
       data.name = req.body.name;
       data.description = req.body.description || ""; //if description is not provided, set it to empty string
       data.altNames =  req.body.altNames || []

       if(req.body.price == null){
        res.status(400).json(
            {
                message: "Product price is required"
            }
        )
        return;
       }

       data.price = req.body.price;
       data.labeledPrice =  req.body.labeledPrice || req.body.price;
       data.category = req.body.category || "others";
       data.images = req.body.images || ["/images/default_product-1.jpg", "/images/default_product -2.jpg"]
       data.isVisible = req.body.isVisible;
       data.brand = req.body.brand || "Generic";
       data.model = req.body.model || "Standard";

       const newProduct = new Product(data);

       await newProduct.save();
       res.status(201).json(
        {
            message: "Product created successfully", product: newProduct
        }
       )


    }catch(error){
        res.status(500).json(
            {
                message: "Error creating product", error: error
            }
        )
    }
}

export async function getProducts(req,res){
    try{

        if(isAdmin(req)){
            const products = await Product.find().lean();
            res.status(200).json(await attachReviewSummary(products))
        }else{
            const products = await Product.find({isVisible: true}).lean();
            res.status(200).json(await attachReviewSummary(products));
        }

    }catch(error){
        res.status(500).json(
            {
                message: "Error fetching products", error: error
            }
        )
    }
}

export async function deleteProduct(req,res) {
    if(!isAdmin(req)){
        res.status(403).json(
            {
                message: "Access denied. Admins only"
            }
        )
        return;
    }
    try{
        const productId = req.params.productId;
        await Product.deleteOne({productId: productId});
        res.status(200).json(
            {
                message: "Product deleted successfully"
            }
        )
    }catch(error){
        res.status(500).json(
            {
                message: "Error deleting product", error: error
            }
        )
    }
}

export async function updateProduct(req,res) {
        if(!isAdmin(req)){
        res.status(403).json(
            {
                message: "Access denied. Admins only"
            }
        )
        return
    }

    try{

       const productId = req.params.productId;


       const data = {}

       

       if(req.body.name == null) {
        res.status(400).json(
            {
                message: "Product name is required"
            }
        )
        return;
       }
       data.name = req.body.name;
       data.description = req.body.description || "";
       data.altNames =  req.body.altNames || [];

       if(req.body.price == null){
        res.status(400).json(
            {
                message: "Product price is required"
            }
        )
        return;
       }

       data.price = req.body.price;
       data.labeledPrice =  req.body.labeledPrice || req.body.price;
       data.category = req.body.category || "others";
       data.images = req.body.images || ["/images/default_product-1.jpg", "/images/default_product-2.jpg"];
       data.isVisible = req.body.isVisible;
       data.brand = req.body.brand || "Generic";
       data.model = req.body.model || "Standard";

       await Product.updateOne({ productId: productId},data);

       
       res.status(201).json(
        {
            message: "Product updated successfully"
        }
       );
    }catch(error){
        res.status(500).json(
            {
                message: "Error updating product", error: error
            }
        )
    }

}

export async function getProductById(req, res){
    try{

        const productId = req.params.productId;
        const product = await Product.findOne({productId: productId}).lean();
        
        if(product == null){
            res.status(404).json({
                message: "Product not found"
            
            })
            return;
        }

        if(!product.isVisible){
            if(!isAdmin(req)){
                res.status(404).json({
                    message: "Product not found"
                })
                return;
            }

        }
        res.status(200).json(await attachReviewSummary(product));

    }catch(error){
         res.status(500).json(
            {
                message: "Error fetching product", error: error.message
            }
        )
    }
}

export async function searchProducts(req, res){
    const query = req.params?.query||"";
    try{
        const products = await Product.find(
            {
                $or : [
                    { name: { $regex: query, $options: "i" } },
                    { description: { $regex: query, $options: "i" } },
                    { altNames: { $elemMatch: { $regex: query, $options: "i" } } }
                ],
                isVisible: true
                
            }
        ).lean()
        res.status(200).json(await attachReviewSummary(products));

    }catch(error){
        res.status(500).json(
            {
                message: "Error searching products", error: error.message
            }
        )
    }
}