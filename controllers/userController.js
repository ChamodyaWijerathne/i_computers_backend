import User from "../models/user.js";
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
import dotenv from "dotenv";

dotenv.config() //load environment variables from .env file


export function createUser(req, res) {

    const hashedPassword = bcrypt.hashSync(req.body.password, 10)

    const user = new User(
        {
            email : req.body.email,
            firstName : req.body.firstName,
            lastName : req.body.lastName,
            password : hashedPassword
            
        }
    )

    user.save().then(
        () => {
            res.json(
                {
                    message : "User created successfully"
                }
            )
        }
    ).catch(
        (error) => {
            res.json(
                {
                    message : "Error creating user", error: error.message
                }
            )
        }
    )
}

export async function createUserAsync(req, res) {
	const hashedPassword = bcrypt.hashSync(req.body.password, 10);

	const user = new User({
		email: req.body.email,
		firstName: req.body.firstName,
		lastName: req.body.lastName,
		password: hashedPassword,
	});
	try {
		
		await user.save();
		res.json({ message: "User created successfully" });

	} catch (error) {

		res.json({ message: "Error creating user", error: error });

	}
}

export function loginUser(req,res) {
    
    User.findOne(
        {
            email : req.body.email
        }
    ).then(
        (user) => {
            if(user == null){
                res.status(404).json(
                    {
                        message : "User with this email does not exist"
                    }
                )
            } else{
                const isPasswordValid = bcrypt.compareSync(req.body.password, user.password)
                
                if(isPasswordValid){

                    const token = jwt.sign({
                        email : user.email,
                        firstName : user.firstName,
                        lastName : user.lastName,
                        role : user.role,
                        image : user.image,
                        isEmailVerified : user.isEmailVerified
                    }, process.env.JWT_SECRET)

                    console.log("Generated Token : ", token)

                    res.json(
                        {
                            message: "Login successful",
                            token : token,
                            role: user.role
                        }
                    )
                } else {
                    res.status(401).json(
                        {
                            message : "Invalid password"
                        }
                    )
                }
            }

        }
    ).catch(
        () => {
            res.status(500).json(
            {
                message : "Internal server error"
            }
        )
        }
    )
}

export function isAdmin(req) {
    if(req.user == null){
        return false
    }
    if(req.user.role != "admin") {
        return false
    }else{
        return true
    }
}