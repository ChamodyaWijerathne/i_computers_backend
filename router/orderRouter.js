import express from "express";
import { createOrder, updateOrderStatus } from "../controllers/orderController.js";
import { getOrders } from "../controllers/orderController.js";


const orderRouter = express.Router()

orderRouter.post("/", createOrder)
orderRouter.get("/:pageSize/:pageNumber", getOrders)
orderRouter.put("/:orderId", updateOrderStatus)

export default orderRouter