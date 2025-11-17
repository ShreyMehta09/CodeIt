const express = require("express");
const router = express.Router();
const OTP = require("../models/OTP");
const User = require("../models/User");
const { generateOTP, sendOTPEmail } = require("../config/email");

// Send OTP
router.post("/send", async (req, res) => {
	try {
		const { email } = req.body;

		if (!email) {
			return res.status(400).json({ message: "Email is required" });
		}

		// Check if user already exists
		const existingUser = await User.findOne({ email: email.toLowerCase() });
		if (existingUser) {
			return res.status(400).json({ message: "Email already registered" });
		}

		// Delete any existing OTPs for this email
		await OTP.deleteMany({ email: email.toLowerCase() });

		// Generate new OTP
		const otp = generateOTP();

		// Save OTP to database
		const otpDoc = new OTP({
			email: email.toLowerCase(),
			otp,
		});
		await otpDoc.save();

		// Send OTP email
		const emailResult = await sendOTPEmail(email, otp);

		if (!emailResult.success) {
			return res
				.status(500)
				.json({
					message:
						"Failed to send OTP email. Please check your email configuration.",
				});
		}

		res.status(200).json({
			message: "OTP sent successfully to your email",
			email: email.toLowerCase(),
		});
	} catch (error) {
		console.error("Send OTP error:", error);
		res.status(500).json({ message: "Server error" });
	}
});

// Verify OTP
router.post("/verify", async (req, res) => {
	try {
		const { email, otp } = req.body;

		if (!email || !otp) {
			return res.status(400).json({ message: "Email and OTP are required" });
		}

		// Find OTP document
		const otpDoc = await OTP.findOne({
			email: email.toLowerCase(),
			otp: otp.trim(),
		});

		if (!otpDoc) {
			return res.status(400).json({ message: "Invalid or expired OTP" });
		}

		// Mark as verified
		otpDoc.verified = true;
		await otpDoc.save();

		res.status(200).json({
			message: "Email verified successfully",
			verified: true,
		});
	} catch (error) {
		console.error("Verify OTP error:", error);
		res.status(500).json({ message: "Server error" });
	}
});

// Resend OTP
router.post("/resend", async (req, res) => {
	try {
		const { email } = req.body;

		if (!email) {
			return res.status(400).json({ message: "Email is required" });
		}

		// Delete existing OTPs
		await OTP.deleteMany({ email: email.toLowerCase() });

		// Generate new OTP
		const otp = generateOTP();

		// Save to database
		const otpDoc = new OTP({
			email: email.toLowerCase(),
			otp,
		});
		await otpDoc.save();

		// Send email
		const emailResult = await sendOTPEmail(email, otp);

		if (!emailResult.success) {
			return res.status(500).json({ message: "Failed to send OTP email" });
		}

		res.status(200).json({ message: "OTP resent successfully" });
	} catch (error) {
		console.error("Resend OTP error:", error);
		res.status(500).json({ message: "Server error" });
	}
});

module.exports = router;
