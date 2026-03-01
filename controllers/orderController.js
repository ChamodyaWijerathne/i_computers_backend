import Order from "../models/order.js";
import Product from "../models/product.js";

export async function createOrder(req, res) {
  try {
    const orderData = {
      orderId: "ORD000001",
      firstName: "John",
      lastName: "Doe",
      addressLine1: "123 Main St",
      addressLine2: "Apt 4B",
      city: "Colombo",
      country: "Sri Lanka",
      postalCode: "12345",
      email: "john.doe@example.com",
      items: [],
      phone: "1234567890",
      total: 0,
    };

    const lastOrder = await Order.findOne().sort({ date: -1 });

    if (lastOrder != null) {
      const lastOrderId = lastOrder.orderId; //"ORD000029"
      const lastOrderNumberInString = lastOrderId.replace("ORD", ""); //"000029"
      const lastOrderNumber = parseInt(lastOrderNumberInString); //29
      const newOrderNumber = lastOrderNumber + 1; //30
      const newOrderNumberInString = newOrderNumber.toString().padStart(6, 0); //"000030"
      orderData.orderId = "ORD" + newOrderNumberInString; //"ORD000030"
    }

    for (let i = 0; i < req.body.items.length; i++) {
      const item = req.body.items[i];
      const product = await Product.findOne({ productId: item.productId });
      if (product == null) {
        res
          .status(404)
          .json({
            message: "Product with id " + item.productId + " not found",
          });
        return;
      }
      if (product.isVisible == false) {
        res.status(404).json({
          message: "Product with id " + item.productId + " is not available",
        });
        return;
      }
      //f qty is needed to be checked, then we can check here
      // if(product.qty < item.qty){
      //     res.status(404).json({
      //         message:"Only " + product.qty + " items are available for product with id " + item.productId
      //     })
      //     return
      // }

      orderData.items.push({
        productId: product.productId,
        name: product.name,
        labelledPrice: product.labelledPrice,
        price: product.price,
        image: product.images[0],
        qty: item.qty,
      })

      orderData.total += product.price * item.qty
    }
    const order = new Order(orderData)
    await order.save()

    //reduce the qty of the products in the collection
    // for(let i = 0; i < orderData.items.length; i++){
    //     const item = orderData.items[i]
    //     await Product.updateOne({productId: item.productId}, {$inc: {qty: -item.qty}})
        
    // }

    res.status(201).json({
        message: "Order created successfully",
        orderId: orderData.orderId
    })

    
  } catch (error) {
    console.error("Error creating order:", error);
    res.status(500).json({ message: "Failed to create order" });
  }
}
