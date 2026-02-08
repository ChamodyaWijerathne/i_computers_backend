import jwt from "jsonwebtoken";
//middleware to extract user from token//Authentication Middleware
import dotenv from "dotenv";

dotenv.config() //load environment variables from .env file

export default function authorizeUser(req,res, next) {
        const header = req.header("Authorization")
        
        if(header != null){
            const token = header.replace("Bearer ", "")
            

            jwt.verify(token, process.env.JWT_SECRET, 
                (err, decoded) => { 
                    
                    if(decoded == null){
                        res.status(401).json({
                            message: "Invalid token. please login again"
                        })
                    } else{
                        req.user = decoded //attach user info to request object
                        next() //move to next middleware or route handler
                    }
                }
            )
        }else{
            next() //move to next middleware or route handler
        }
}
