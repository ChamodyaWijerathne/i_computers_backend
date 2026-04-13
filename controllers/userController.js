import User from "../models/user.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import OTP from "../models/otp.js";
import nodemailer from "nodemailer";
import axios from "axios";

dotenv.config(); //load environment variables from .env file

const transporter = nodemailer.createTransport({
	service: "gmail",
	host: "smtp.gmail.com",
	port: 587,
	secure: false,
	auth: {
		user: process.env.EMAIL_USER,
		pass: process.env.EMAIL_PASSWORD,
	},
});

export function createUser(req, res) {
	const hashedPassword = bcrypt.hashSync(req.body.password, 10);

	const user = new User({
		email: req.body.email,
		firstName: req.body.firstName,
		lastName: req.body.lastName,
		password: hashedPassword,
	});

	user
		.save()
		.then(() => {
			res.json({
				message: "User created successfully",
			});
		})
		.catch((error) => {
			res.json({
				message: "Error creating user",
				error: error.message,
			});
		});
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

export function loginUser(req, res) {
	User.findOne({
		email: req.body.email,
	})
		.then((user) => {
			if (user == null) {
				res.status(404).json({
					message: "User with this email does not exist",
				});
			} else {
				const isPasswordValid = bcrypt.compareSync(
					req.body.password,
					user.password,
				);

				if (isPasswordValid) {
					const token = jwt.sign(
						{
							email: user.email,
							firstName: user.firstName,
							lastName: user.lastName,
							role: user.role,
							image: user.image,
							isEmailVerified: user.isEmailVerified,
						},
						process.env.JWT_SECRET,
						{ expiresIn: req.body.rememberMe ? "30d" : "48h" },
						//if rememberMe is true, token will expire in 30 days, otherwise it will expire in 48 hours
					);

					res.json({
						message: "Login successful",
						token: token,
						role: user.role,
					});
				} else {
					res.status(401).json({
						message: "Invalid password",
					});
				}
			}
		})
		.catch(() => {
			res.status(500).json({
				message: "Internal server error",
			});
		});
}

export function getUser(req, res) {
	if (req.user == null) {
		res.status(401).json({
			message: "Unauthorized. Please login to view user details.",
		});
		return;
	}
	res.json({
		email: req.user.email,
		firstName: req.user.firstName,
		lastName: req.user.lastName,
		role: req.user.role,
		image: req.user.image,
		isEmailVerified: req.user.isEmailVerified,
	});
}

export async function updateUserProfile(req, res) {
	if (req.user == null) {
		res.status(401).json({
			message: "Unauthorized. Please login to update user details.",
		});
		return;
	}
	try {
		await User.updateOne(
			{
				email: req.user.email,
			},
			{
				firstName: req.body.firstName,
				lastName: req.body.lastName,
				image: req.body.image,
			},
		);
		const user = await User.findOne({ email: req.user.email }); //find user again to get updated details for token generation

		const token = jwt.sign(
			{
				//generate new token with updated user details
				email: user.email,
				firstName: user.firstName,
				lastName: user.lastName,
				role: user.role,
				image: user.image,
				isEmailVerified: user.isEmailVerified,
			},
			process.env.JWT_SECRET,
			{ expiresIn: req.body.rememberMe ? "30d" : "48h" },
		);

		res.json({
			message: "User profile updated successfully",
			token: token,
		});
	} catch (error) {
		res.status(500).json({
			message: "Error updating user profile",
			error: error.message,
		});
		return;
	}
}

export async function changeUserPassword(req, res) {
	if (req.user == null) {
		res.status(401).json({
			message: "Unauthorized. Please login to change password.",
		});
		return;
	}
	try {
		const hashedPassword = bcrypt.hashSync(req.body.password, 10);
		await User.updateOne(
			{
				email: req.user.email,
			},
			{
				password: hashedPassword,
			},
		);
		res.json({
			message: "Password changed successfully",
		});
	} catch (error) {
		res.status(500).json({
			message: "Error changing password",
			error: error.message,
		});
		return;
	}
}

export function isAdmin(req) {
	if (req.user == null) {
		return false;
	}
	if (req.user.role != "admin") {
		return false;
	} else {
		return true;
	}
}

export async function sendOTP(req, res) {
	try {
		const user = await User.findOne({ email: req.body.email });
		if (user == null) {
			res.status(404).json({
				message: "User with this email does not exist",
			});
			return;
		}
		const otp = Math.floor(100000 + Math.random() * 900000);
		await OTP.delete;
		//delete any existing OTP for this email before creating a new one
		await OTP.findOneAndUpdate(
			{ email: req.body.email },
			{ otp: otp },
			{ upsert: true, new: true },
		);
		const message = {
			from: process.env.EMAIL_USER,
			to: req.body.email,
			subject: "Password Reset OTP",
			text: `Your OTP for password reset is ${otp}. It is valid for 10 minutes.`,
		};
		transporter.sendMail(message, (error, info) => {
			if (error) {
				res.status(500).json({
					message: "Error sending OTP",
					error: error.message,
				});
			} else {
				res.json({
					message: "OTP sent successfully",
				});
			}
		});
	} catch (error) {
		res.status(500).json({
			message: "Error sending OTP",
			error: error.message,
		});
		return;
	}
}

export async function verifyOTP(req, res) {
	try {
		const otpCode = req.body.otp;
		const email = req.body.email;
		const newPassword = req.body.newPassword;

		const otpRecord = await OTP.findOne({ email: email });
		if (otpRecord == null) {
			res.status(404).json({
				message: "OTP not found for this email",
			});
			return;
		}
		if (otpRecord.otp != otpCode) {
			res.status(400).json({
				message: "Invalid OTP",
			});
			return;
		}
		const hashedPassword = bcrypt.hashSync(newPassword, 10);
		await User.updateOne({ email: email }, { password: hashedPassword });
		await OTP.deleteOne({ email: email }); //delete OTP record after successful password reset
		res.json({
			message: "Password reset successful",
		});
	} catch (error) {
		res.status(500).json({
			message: "Error verifying OTP",
			error: error.message,
		});
		return;
	}
}


export async function googleLogin(req, res) {
	try {
		const googleResponse = await axios.get(
			"https://www.googleapis.com/oauth2/v2/userinfo",
			{
				headers: {
					Authorization: "Bearer " + req.body.token,
				},
			},
		);
		const user = await User.findOne({ email: googleResponse.data.email });
		if (user == null) {
			const newUser = new User({
				email: googleResponse.data.email,
				firstName: googleResponse.data.given_name,
				lastName: googleResponse.data.family_name,
				password: "google-login", //no password since user is logging in with Google
				image: googleResponse.data.picture,
				isEmailVerified: true,
			});
			await newUser.save();
			const token = jwt.sign(
				{
					email: newUser.email,
					firstName: newUser.firstName,
					lastName: newUser.lastName,
					role: newUser.role,
					image: newUser.image,
					isEmailVerified: newUser.isEmailVerified,
				},
				process.env.JWT_SECRET,
				{ expiresIn: req.body.rememberMe ? "30d" : "48h" },
			);
			res.json({
				message: "Login successful",
				token: token,
				role: newUser.role,
			});
		} else {
			const token = jwt.sign(
				{
					email: user.email,
					firstName: user.firstName,
					lastName: user.lastName,
					role: user.role,
					image: user.image,
					isEmailVerified: user.isEmailVerified,
				},
				process.env.JWT_SECRET,
				{ expiresIn: req.body.rememberMe ? "30d" : "48h" },
			);
			res.json({
				message: "Login successful",
				token: token,
				role: user.role,
			});
		}
	} catch (error) {
		res.status(500).json({
			message: "Error during Google login",
			error: error.message,
		});
		return;
	}
}

export async function getAllUsers(req, res) {
	if (!isAdmin(req)) {
		res.status(403).json({
			message: "Forbidden. Admin access required to view all users.",
		});
		return;
	}
	try{
		const pageSizeString = req.params.pageSize || "10"
		const pageNumberString = req.params.pageNumber || "1"

		const pageNumber = parseInt(pageNumberString)
		const pageSize = parseInt(pageSizeString)
		const numberOfUsers = await User.countDocuments()//total number of users in the collection
		const numberOfPages = Math.ceil(numberOfUsers/pageSize)//calculate total number of pages based on page size

		const users = await User.find({}).sort({date: -1}).skip((pageNumber-1) * pageSize).limit(pageSize) //pagination

		res.json({
			users: users,
			totalPages: numberOfPages,
			
		})
		}catch(error){
		res.status(500).json({
			message: "Error fetching users",
			error: error.message,
		});
		
	}
}

export async function blockOrUnblockUser(req,res){
	if (!isAdmin(req)) {
		res.status(403).json({
			message: "Forbidden. Admin access required to block or unblock users.",
		});
		return;
	}
	const email = req.body.email;
	if(req.user.email == email){
		res.status(400).json({
			message: "You cannot block or unblock yourself.",
		});
		return;
	}
	try{
		const user = await User.findOne({ email: email });
		if(user == null){
			res.status(404).json({
				message: "User with this email does not exist",
			});
			return;
		}
		await User.updateOne({email: email}, {isBlocked: !user.isBlocked})//toggle isBlocked field to block or unblock user
		res.json({
			message: user.isBlocked ? "User unblocked successfully" : "User blocked successfully",
		})

	}catch(error){
		res.status(500).json({
			message: "Error blocking or unblocking user",
			error: error.message,
		});
		return;
	}
}

export async function changeUserRole(req,res){
	if (!isAdmin(req)) {
		res.status(403).json({
			message: "Forbidden. Admin access required to change user roles.",
		});
		return;
	}
	const email = req.body.email
	if(req.user.email == email){
		res.status(400).json({
			message: "You cannot change your own role.",
		});
		return;
	}

	try{
		const user = await User.findOne({ email: email });
		if(user == null){
			res.status(404).json({
				message: "User with this email does not exist",
			});
			return;
		}
		await User.updateOne({email: email}, {role: user.role === "admin" ? "user" : "admin"})//toggle role between admin and user
		res.json({
			message: user.role === "admin" ? "User role changed to user successfully" : "User role changed to admin successfully",
		})
	}catch(error){
		res.status(500).json({
			message: "Error changing user role",
			error: error.message,
		});
		return;
	}
}


