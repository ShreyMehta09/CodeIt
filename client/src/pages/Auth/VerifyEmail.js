import React, { useState, useEffect, useRef } from "react";
import {
	Mail,
	ArrowLeft,
	RefreshCw,
	CheckCircle,
	AlertCircle,
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import Button from "../../components/UI/Button";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

const VerifyEmail = () => {
	const [otp, setOtp] = useState(["", "", "", "", "", ""]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");
	const [success, setSuccess] = useState(false);
	const [resendLoading, setResendLoading] = useState(false);
	const [resendTimer, setResendTimer] = useState(60);
	const [canResend, setCanResend] = useState(false);

	const navigate = useNavigate();
	const location = useLocation();
	const email = location.state?.email;
	const registrationData = location.state?.registrationData;

	const inputRefs = useRef([]);

	useEffect(() => {
		if (!email || !registrationData) {
			navigate("/auth/register");
		}
	}, [email, registrationData, navigate]);

	// Resend timer countdown
	useEffect(() => {
		if (resendTimer > 0) {
			const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
			return () => clearTimeout(timer);
		} else {
			setCanResend(true);
		}
	}, [resendTimer]);

	// Auto-focus first input on mount
	useEffect(() => {
		if (inputRefs.current[0]) {
			inputRefs.current[0].focus();
		}
	}, []);

	const handleOtpChange = (index, value) => {
		// Only allow digits
		if (!/^\d*$/.test(value)) return;

		const newOtp = [...otp];

		// Handle paste event
		if (value.length > 1) {
			const pastedData = value.slice(0, 6).split("");
			pastedData.forEach((char, i) => {
				if (index + i < 6) {
					newOtp[index + i] = char;
				}
			});
			setOtp(newOtp);

			// Focus on the next empty input or last input
			const nextIndex = Math.min(index + pastedData.length, 5);
			inputRefs.current[nextIndex]?.focus();
			return;
		}

		// Handle single character input
		newOtp[index] = value;
		setOtp(newOtp);

		// Auto-focus next input
		if (value && index < 5) {
			inputRefs.current[index + 1]?.focus();
		}
	};

	const handleKeyDown = (index, e) => {
		// Handle backspace
		if (e.key === "Backspace" && !otp[index] && index > 0) {
			inputRefs.current[index - 1]?.focus();
		}

		// Handle arrow keys
		if (e.key === "ArrowLeft" && index > 0) {
			inputRefs.current[index - 1]?.focus();
		}
		if (e.key === "ArrowRight" && index < 5) {
			inputRefs.current[index + 1]?.focus();
		}
	};

	const handleVerify = async (e) => {
		e.preventDefault();
		const otpString = otp.join("");

		if (otpString.length !== 6) {
			setError("Please enter the complete 6-digit OTP");
			return;
		}

		setLoading(true);
		setError("");

		try {
			// Verify OTP
			const verifyResponse = await axios.post(`${API_URL}/otp/verify`, {
				email,
				otp: otpString,
			});

			if (verifyResponse.data.verified) {
				setSuccess(true);

				// Wait a moment to show success state
				setTimeout(async () => {
					try {
						// Now proceed with registration
						const registerResponse = await axios.post(
							`${API_URL}/auth/register`,
							registrationData
						);

						if (registerResponse.data.token) {
							localStorage.setItem("token", registerResponse.data.token);
							navigate("/dashboard", {
								state: {
									message: "Registration successful! Welcome to CodeIt!",
								},
							});
						}
					} catch (regError) {
						console.error("Registration error:", regError);
						setError(
							regError.response?.data?.message ||
								"Registration failed after verification"
						);
						setSuccess(false);
					}
				}, 1000);
			}
		} catch (err) {
			console.error("Verification error:", err);
			setError(
				err.response?.data?.message ||
					"Invalid or expired OTP. Please try again."
			);
			setOtp(["", "", "", "", "", ""]);
			inputRefs.current[0]?.focus();
		} finally {
			setLoading(false);
		}
	};

	const handleResend = async () => {
		setResendLoading(true);
		setError("");

		try {
			await axios.post(`${API_URL}/otp/resend`, { email });
			setResendTimer(60);
			setCanResend(false);
			setOtp(["", "", "", "", "", ""]);
			inputRefs.current[0]?.focus();
		} catch (err) {
			console.error("Resend error:", err);
			setError(err.response?.data?.message || "Failed to resend OTP");
		} finally {
			setResendLoading(false);
		}
	};

	return (
		<div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50 px-4">
			<div className="max-w-md w-full">
				<div className="bg-white rounded-2xl shadow-xl p-8">
					{/* Header */}
					<div className="text-center mb-8">
						<div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-100 rounded-full mb-4">
							<Mail className="w-8 h-8 text-indigo-600" />
						</div>
						<h2 className="text-3xl font-bold text-gray-900 mb-2">
							Verify Your Email
						</h2>
						<p className="text-gray-600">
							We've sent a 6-digit verification code to
						</p>
						<p className="text-indigo-600 font-semibold mt-1">{email}</p>
					</div>

					{/* Success Message */}
					{success && (
						<div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
							<CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
							<div className="text-sm text-green-800">
								Email verified successfully! Completing registration...
							</div>
						</div>
					)}

					{/* Error Message */}
					{error && (
						<div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
							<AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
							<div className="text-sm text-red-800">{error}</div>
						</div>
					)}

					{/* OTP Input Form */}
					<form onSubmit={handleVerify}>
						<div className="flex justify-center gap-3 mb-8">
							{otp.map((digit, index) => (
								<input
									key={index}
									ref={(el) => (inputRefs.current[index] = el)}
									type="text"
									maxLength={6}
									value={digit}
									onChange={(e) => handleOtpChange(index, e.target.value)}
									onKeyDown={(e) => handleKeyDown(index, e)}
									disabled={loading || success}
									className={`w-12 h-14 text-center text-2xl font-bold border-2 rounded-lg transition-all
                    ${
											success
												? "border-green-500 bg-green-50 text-green-700"
												: digit
												? "border-indigo-500 bg-indigo-50 text-indigo-700"
												: "border-gray-300 hover:border-indigo-400"
										}
                    focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
                    disabled:opacity-50 disabled:cursor-not-allowed
                  `}
									autoComplete="off"
								/>
							))}
						</div>

						{/* Verify Button */}
						<Button
							type="submit"
							variant="primary"
							className="w-full mb-4"
							disabled={loading || success || otp.join("").length !== 6}
						>
							{loading ? (
								<span className="flex items-center justify-center gap-2">
									<RefreshCw className="w-4 h-4 animate-spin" />
									Verifying...
								</span>
							) : success ? (
								<span className="flex items-center justify-center gap-2">
									<CheckCircle className="w-4 h-4" />
									Verified!
								</span>
							) : (
								"Verify Email"
							)}
						</Button>

						{/* Resend Section */}
						<div className="text-center">
							{!canResend ? (
								<p className="text-sm text-gray-600">
									Didn't receive the code? Resend in{" "}
									<span className="font-semibold text-indigo-600">
										{resendTimer}s
									</span>
								</p>
							) : (
								<button
									type="button"
									onClick={handleResend}
									disabled={resendLoading}
									className="text-sm text-indigo-600 hover:text-indigo-700 font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mx-auto"
								>
									<RefreshCw
										className={`w-4 h-4 ${resendLoading ? "animate-spin" : ""}`}
									/>
									{resendLoading ? "Sending..." : "Resend Code"}
								</button>
							)}
						</div>
					</form>

					{/* Back to Register */}
					<div className="mt-6 pt-6 border-t border-gray-200">
						<button
							onClick={() => navigate("/auth/register")}
							className="flex items-center justify-center gap-2 text-sm text-gray-600 hover:text-gray-900 mx-auto transition-colors"
						>
							<ArrowLeft className="w-4 h-4" />
							Back to Registration
						</button>
					</div>

					{/* Tips */}
					<div className="mt-6 p-4 bg-blue-50 rounded-lg">
						<p className="text-xs text-blue-800">
							<strong>💡 Tips:</strong> Check your spam folder if you don't see
							the email. The code expires in 10 minutes. You can paste the
							entire code at once.
						</p>
					</div>
				</div>
			</div>
		</div>
	);
};

export default VerifyEmail;
