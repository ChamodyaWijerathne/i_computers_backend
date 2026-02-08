import express from "express";
import mongoose from "mongoose";
import userRouter from "./router/userRouter.js";
import productRouter from "./router/productRouter.js";
import authorizeUser from "./lib/jwdMiddleware.js";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config() //load environment variables from .env file

//mongoDB connection string
const mongoURL = process.env.MONGO_URI

//connect mongoose lib. to mongoDB
mongoose.connect(mongoURL).then(
    ()=>{
        console.log("Connected to MongoDB")
    }
).catch(
    ()=>{
        console.log("Error connecting to MongoDB")
    }
)

//create express app
const app = express();

app.use(cors())

//middleware to parse json body
app.use(express.json())

app.use(authorizeUser)

app.use("/api/users", userRouter)
app.use("/api/products", productRouter)

app.listen(3000, () =>{
    console.log("Server is running on port" );
    }
)