import express from "express"
import { changeUserPassword, createUser, getUser, loginUser, updateUserProfile, sendOTP, verifyOTP, googleLogin, getAllUsers, blockOrUnblockUser, changeUserRole } from "../controllers/userController.js"
import { getMyReviews } from "../controllers/reviewController.js"

const userRouter = express.Router()

userRouter.post("/", createUser)//localhost:3000/users
userRouter.post("/login", loginUser) //localhost:3000/users/login
userRouter.get("/profile", getUser)
userRouter.post("/update-password", changeUserPassword) 
userRouter.post("/send-otp", sendOTP)
userRouter.post("/verify-otp",verifyOTP)
userRouter.post("/google-login", googleLogin)
userRouter.put("/", updateUserProfile)
userRouter.get("/all/:pageSize/:pageNumber", getAllUsers)
userRouter.post("/toggle-block", blockOrUnblockUser)
userRouter.post("/toggle-role", changeUserRole)
userRouter.get("/me/reviews", getMyReviews)


export default userRouter