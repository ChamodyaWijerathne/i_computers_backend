import Order from "../models/order.js";
import Product from "../models/product.js";


export async function createOrder(req, res) {

	if(req.user == null){
		res.status(401).json({
			message: "Unauthorized. Please login to place an order."
		})
		return
	}

  try {
    const orderData = {
      orderId: "ORD000001",
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      addressLine1: req.body.addressLine1,
      addressLine2: req.body.addressLine2,
      city: req.body.city,
      country: req.body.country,
      postalCode: req.body.postalCode,
      email: req.user.email,
      items: [],
      phone: req.body.phone,
      total: 0,
    };

    if (orderData.firstName == "") {
      orderData.firstName = req.user.firstName
    }
  if (orderData.lastName == "") {
		orderData.lastName = req.user.lastName
	}
  if (orderData.addressLine1 == "") {
		res.status(400).json({
			message: "Address Line 1 is required"
		})
		return
	}
  if (orderData.addressLine2 == "") {
		res.status(400).json({
			message: "Address Line 2 is required"
		})
	return
	}
  if (orderData.city == "") {
		res.status(400).json({
			message: "City is required"
		})
	return
	}	
  if (orderData.phone == "") {
		res.status(400).json({
			message: "Phone is required"
		})
	return
	}

		

    const lastOrder = await Order.findOne().sort({ date: -1 });

    if (lastOrder != null) {
      const lastOrderId = lastOrder.orderId; //"ORD000029"
      const lastOrderNumberInString = lastOrderId.replace("ORD", ""); //"000029"
      const lastOrderNumber = parseInt(lastOrderNumberInString); //29
      const newOrderNumber = lastOrderNumber + 1; //30
      const newOrderNumberInString = newOrderNumber.toString().padStart(6, "0"); //"000030"
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

export async function getOrders(req, res){
	if(req.user == null){
		res.status(401).json(
			{
				message: "Unauthorized. Please login to view your orders."
			}
		)
	}

	const pageSizeString = req.params.pageSize || "10"
	const pageNumberString = req.params.pageNumber || "1"

	const pageNumber = parseInt(pageNumberString)
	const pageSize = parseInt(pageSizeString)

	try{
		if(isAdmin(req)){
			const numberOfOrders = await Order.countDocuments()//total number of orders in the collection
			const numberOfPages = Math.ceil(numberOfOrders/pageSize)

			const orders = await Order.find().sort({date: -1}).skip((pageNumber-1) * pageSize).limit(pageSize)//

		}
	}catch(error){
		console.error("Error fetching orders:", error)
		res.status(500).json({message: "Failed to fetch orders"})

	}
}
