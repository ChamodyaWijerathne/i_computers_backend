import { isAdmin } from "./userController.js";
import Product from "../models/product.js";

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
       data.description = req.body.description || "";
       data.altName =  req.body.altNames || []

       if(req.body.price == null){
        res.status(400).json(
            {
                message: "Product price is required"
            }
        )
        return;
       }

       data.price = req.body.price;
       data.labeledPrice =  req.body.labeledPrice || req.body.price
       data.category = req.body.category || "others"
       data.images = req.body.images || ["/images/default_product-1.jpg", "/images/default_product -2.jpg"]
       data.isVisible = req.body.isVisible
       data.brand = req.body.brand || "Generic"
       data.model = req.body.model || "Standard"

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
                message: "Error creating product"
            }
        )
    }
}

export async function getProducts(req,res){
    try{

        if(isAdmin(req)){
            const products = await Product.find();
            res.status(200).json(products)
        }else{
            const products = await Product.find({isVisible: true});
            res.status(200).json(products);
        }

    }catch(error){
        res.status(500).json(
            {
                message: "Error fetching products", error: error.message
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
                message: "Error deleting product", error: error.message
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
       data.altName =  req.body.altNames || []

       if(req.body.price == null){
        res.status(400).json(
            {
                message: "Product price is required"
            }
        )
        return;
       }

       data.price = req.body.price;
       data.labeledPrice =  req.body.labeledPrice || req.body.price
       data.category = req.body.category || "others"
       data.images = req.body.images || ["/images/default_product-1.jpg", "/images/default_product -2.jpg"]
       data.isVisible = req.body.isVisible
       data.brand = req.body.brand || "Generic"
       data.model = req.body.model || "Standard"

       await Product.updateOne({ productId: productId},data)

       
       res.status(201).json(
        {
            message: "Product updated successfully"
        }
       )


    }catch(error){
        res.status(500).json(
            {
                message: "Error updating product"
            }
        )
    }

}

export async function getProductById(req, res){
    try{

        const productId = req.params.productId;
        const product = await Product.findOne({productId: productId});
        
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
        res.status(200).json(product);

    }catch(error){
         res.status(500).json(
            {
                message: "Error fetching product", error: error.message
            }
        )
    }
}

export async function searchProducts(req, res){
    
}