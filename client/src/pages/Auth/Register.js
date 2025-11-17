import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { Eye, EyeOff } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import Button from "../../components/UI/Button";
import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

const Register = () => {
	const { register: registerUser } = useAuth();
	const navigate = useNavigate();
	const [showPassword, setShowPassword] = useState(false);
	const [showConfirmPassword, setShowConfirmPassword] = useState(false);
	const [loading, setLoading] = useState(false);

	const {
		register,
		handleSubmit,
		formState: { errors },
		setError,
		watch,
	} = useForm();

	const password = watch("password");

	const onSubmit = async (data) => {
		setLoading(true);

		try {
			// First, send OTP to email
			const otpResponse = await axios.post(`${API_URL}/otp/send`, {
				email: data.email,
			});

			if (otpResponse.data.message) {
				// Navigate to verification page with registration data
				navigate("/auth/verify-email", {
					state: {
						email: data.email,
						registrationData: {
							name: data.name,
							email: data.email,
							password: data.password,
							username: data.username,
						},
					},
				});
			}
		} catch (error) {
			console.error("OTP send error:", error);
			setError("root", {
				message:
					error.response?.data?.message ||
					"Failed to send verification code. Please try again.",
			});
		} finally {
			setLoading(false);
		}
	};

	const handleGoogleSignup = () => {
		window.location.href = `${
			process.env.REACT_APP_API_URL || "http://localhost:5000/api"
		}/auth/google`;
	};

	return (
		<div>
			<div className="mb-6">
				<h2 className="text-2xl font-bold text-gray-900 dark:text-white">
					Create your account
				</h2>
				<p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
					Or{" "}
					<Link
						to="/auth/login"
						className="font-medium text-primary-600 hover:text-primary-500"
					>
						sign in to your existing account
					</Link>
				</p>
			</div>

			<form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
				{errors.root && (
					<div className="bg-danger-50 border border-danger-200 text-danger-700 px-4 py-3 rounded">
						{errors.root.message}
					</div>
				)}

				<div>
					<label
						htmlFor="name"
						className="block text-sm font-medium text-gray-700 dark:text-gray-300"
					>
						Full Name
					</label>
					<div className="mt-1">
						<input
							{...register("name", {
								required: "Full name is required",
								minLength: {
									value: 2,
									message: "Name must be at least 2 characters",
								},
							})}
							type="text"
							autoComplete="name"
							className="input w-full"
							placeholder="Enter your full name"
						/>
						{errors.name && (
							<p className="mt-1 text-sm text-danger-600">
								{errors.name.message}
							</p>
						)}
					</div>
				</div>

				<div>
					<label
						htmlFor="username"
						className="block text-sm font-medium text-gray-700 dark:text-gray-300"
					>
						Username{" "}
						<span className="text-gray-500 dark:text-gray-400">(optional)</span>
					</label>
					<div className="mt-1">
						<input
							{...register("username", {
								minLength: {
									value: 3,
									message: "Username must be at least 3 characters",
								},
								pattern: {
									value: /^[a-zA-Z0-9_]+$/,
									message:
										"Username can only contain letters, numbers, and underscores",
								},
							})}
							type="text"
							autoComplete="username"
							className="input w-full"
							placeholder="Choose a username"
						/>
						{errors.username && (
							<p className="mt-1 text-sm text-danger-600">
								{errors.username.message}
							</p>
						)}
					</div>
				</div>

				<div>
					<label
						htmlFor="email"
						className="block text-sm font-medium text-gray-700 dark:text-gray-300"
					>
						Email address
					</label>
					<div className="mt-1">
						<input
							{...register("email", {
								required: "Email is required",
								pattern: {
									value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
									message: "Please enter a valid email address",
								},
							})}
							type="email"
							autoComplete="email"
							className="input w-full"
							placeholder="Enter your email"
						/>
						{errors.email && (
							<p className="mt-1 text-sm text-danger-600">
								{errors.email.message}
							</p>
						)}
					</div>
				</div>

				<div>
					<label
						htmlFor="password"
						className="block text-sm font-medium text-gray-700 dark:text-gray-300"
					>
						Password
					</label>
					<div className="mt-1 relative">
						<input
							{...register("password", {
								required: "Password is required",
								minLength: {
									value: 6,
									message: "Password must be at least 6 characters",
								},
							})}
							type={showPassword ? "text" : "password"}
							autoComplete="new-password"
							className="input w-full pr-10"
							placeholder="Create a password"
						/>
						<button
							type="button"
							className="absolute inset-y-0 right-0 pr-3 flex items-center"
							onClick={() => setShowPassword(!showPassword)}
						>
							{showPassword ? (
								<EyeOff className="h-4 w-4 text-gray-400" />
							) : (
								<Eye className="h-4 w-4 text-gray-400" />
							)}
						</button>
						{errors.password && (
							<p className="mt-1 text-sm text-danger-600">
								{errors.password.message}
							</p>
						)}
					</div>
				</div>

				<div>
					<label
						htmlFor="confirmPassword"
						className="block text-sm font-medium text-gray-700 dark:text-gray-300"
					>
						Confirm Password
					</label>
					<div className="mt-1 relative">
						<input
							{...register("confirmPassword", {
								required: "Please confirm your password",
								validate: (value) =>
									value === password || "Passwords do not match",
							})}
							type={showConfirmPassword ? "text" : "password"}
							autoComplete="new-password"
							className="input w-full pr-10"
							placeholder="Confirm your password"
						/>
						<button
							type="button"
							className="absolute inset-y-0 right-0 pr-3 flex items-center"
							onClick={() => setShowConfirmPassword(!showConfirmPassword)}
						>
							{showConfirmPassword ? (
								<EyeOff className="h-4 w-4 text-gray-400" />
							) : (
								<Eye className="h-4 w-4 text-gray-400" />
							)}
						</button>
						{errors.confirmPassword && (
							<p className="mt-1 text-sm text-danger-600">
								{errors.confirmPassword.message}
							</p>
						)}
					</div>
				</div>

				<div className="flex items-center">
					<input
						id="agree-terms"
						{...register("agreeTerms", {
							required: "You must agree to the terms and conditions",
						})}
						type="checkbox"
						className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
					/>
					<label
						htmlFor="agree-terms"
						className="ml-2 block text-sm text-gray-900"
					>
						I agree to the{" "}
						<a href="#" className="text-primary-600 hover:text-primary-500">
							Terms and Conditions
						</a>{" "}
						and{" "}
						<a href="#" className="text-primary-600 hover:text-primary-500">
							Privacy Policy
						</a>
					</label>
				</div>
				{errors.agreeTerms && (
					<p className="text-sm text-danger-600">{errors.agreeTerms.message}</p>
				)}

				<div>
					<Button type="submit" loading={loading} className="w-full" size="lg">
						Create Account
					</Button>
				</div>

				<div className="mt-6">
					<div className="relative">
						<div className="absolute inset-0 flex items-center">
							<div className="w-full border-t border-gray-300" />
						</div>
						<div className="relative flex justify-center text-sm">
							<span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">
								Or continue with
							</span>
						</div>
					</div>

					<div className="mt-6">
						<Button
							type="button"
							variant="outline"
							className="w-full"
							onClick={handleGoogleSignup}
						>
							<svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
								<path
									fill="currentColor"
									d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
								/>
								<path
									fill="currentColor"
									d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
								/>
								<path
									fill="currentColor"
									d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
								/>
								<path
									fill="currentColor"
									d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
								/>
							</svg>
							Sign up with Google
						</Button>
					</div>
				</div>
			</form>
		</div>
	);
};

export default Register;
