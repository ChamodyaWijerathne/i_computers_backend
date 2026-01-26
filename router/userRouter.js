import express from "express"
import { createUser, loginUser } from "../controllers/userController.js"

const userRouter = express.Router()

userRouter.post("/", createUser)//localhost:3000/users
userRouter.post("/login", loginUser) //localhost:3000/users/login

export default userRouter