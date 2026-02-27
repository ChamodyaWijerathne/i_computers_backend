import mongoose from  'mongoose';

const orderSchema = new mongoose.Schema({
    orderId:{
        type: String,
        required: true,
        unique: true
    },
    firstName:{
        type: String,
        required: true
    },
    lastName:{
        type: String,
        required: true
    },
    addressLine1:{
        type: String,
        required: trusted
    },
    addressLine2:{
        type: String
    },
    city:{
        type: String,
        required: true
    },
    country:{
        type: String,
        required: true,
        default: "Sri Lanka"
    },
    postalCode:{
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true    
    },
    phone: {
        type: String,
        required: true
    },
    items:{
        type:[
            {
                productId:{
                    type: String,
                    required: true
                },
                name:{
                    type: String,
                    required: true
                },
                labelledPrice:{
                    type: Number,
                },
                price:{
                    type: Number,
                    required: true
                },
                image:{
                    type: String,
                    default: "/images/default_product-1.jpg"
                },
                qty:{
                    type: Number,
                    required: true
                }
            }
        ]
    },
    total:{
        type: Number,
        required: true
    },
    status:{
        type: String,
        required: true,
        default: "Pending"
    }
})

const Order = mongoose.model("Order", orderSchema)
export default Order;