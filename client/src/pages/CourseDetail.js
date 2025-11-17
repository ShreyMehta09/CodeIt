import React, { useState } from "react";
import { useQuery, useMutation } from "react-query";
import { useParams, useNavigate } from "react-router-dom";
import {
	BookOpen,
	Clock,
	Users,
	Play,
	Lock,
	CheckCircle,
	Award,
	ArrowLeft,
	Youtube,
	FileText,
	Code,
	Star,
} from "lucide-react";
import axios from "axios";
import LoadingSpinner from "../components/UI/LoadingSpinner";
import Button from "../components/UI/Button";
import toast from "react-hot-toast";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

const CourseDetail = () => {
	const { id } = useParams();
	const navigate = useNavigate();
	const [processingPayment, setProcessingPayment] = useState(false);

	// Fetch course details
	const {
		data: courseData,
		isLoading,
		refetch,
	} = useQuery(["course", id], async () => {
		const token = localStorage.getItem("token");
		const headers = token ? { Authorization: `Bearer ${token}` } : {};

		const response = await axios.get(`${API_URL}/courses/${id}`, { headers });
		return response.data;
	});

	// Enroll mutation
	const enrollMutation = useMutation(
		async () => {
			const token = localStorage.getItem("token");
			if (!token) {
				throw new Error("Please login to enroll");
			}

			const response = await axios.post(
				`${API_URL}/courses/${id}/enroll`,
				{},
				{ headers: { Authorization: `Bearer ${token}` } }
			);
			return response.data;
		},
		{
			onSuccess: (data) => {
				// Initialize Razorpay
				loadRazorpay(data);
			},
			onError: (error) => {
				toast.error(
					error.response?.data?.message || "Failed to initiate payment"
				);
				setProcessingPayment(false);
			},
		}
	);

	const loadRazorpay = (orderData) => {
		const script = document.createElement("script");
		script.src = "https://checkout.razorpay.com/v1/checkout.js";
		script.onerror = () => {
			toast.error("Failed to load payment gateway");
			setProcessingPayment(false);
		};
		script.onload = () => {
			const options = {
				key: orderData.keyId,
				amount: orderData.amount,
				currency: orderData.currency,
				name: "CodeIt",
				description: orderData.courseName,
				order_id: orderData.orderId,
				handler: async function (response) {
					await verifyPayment(response);
				},
				prefill: {
					name: localStorage.getItem("userName") || "",
					email: localStorage.getItem("userEmail") || "",
				},
				theme: {
					color: "#4F46E5",
				},
				modal: {
					ondismiss: function () {
						setProcessingPayment(false);
						toast.error("Payment cancelled");
					},
				},
			};

			const rzp = new window.Razorpay(options);
			rzp.open();
		};
		document.body.appendChild(script);
	};

	const verifyPayment = async (paymentData) => {
		try {
			const token = localStorage.getItem("token");
			await axios.post(`${API_URL}/courses/${id}/verify-payment`, paymentData, {
				headers: { Authorization: `Bearer ${token}` },
			});

			toast.success("🎉 Enrollment successful! Welcome to the course!");
			setProcessingPayment(false);

			// Refetch course data to update enrollment status
			await refetch();

			// Navigate to course player after a short delay
			setTimeout(() => {
				navigate(`/courses/${id}/learn`);
			}, 1500);
		} catch (error) {
			toast.error(
				error.response?.data?.message || "Payment verification failed"
			);
			setProcessingPayment(false);
		}
	};

	const handleEnroll = () => {
		const token = localStorage.getItem("token");
		if (!token) {
			toast.error("Please login to enroll in this course");
			navigate("/auth/login");
			return;
		}

		setProcessingPayment(true);
		enrollMutation.mutate();
	};

	const handleStartLearning = () => {
		navigate(`/courses/${id}/learn`);
	};

	if (isLoading) {
		return (
			<div className="flex items-center justify-center h-64">
				<LoadingSpinner size="lg" />
			</div>
		);
	}

	if (!courseData) {
		return (
			<div className="text-center py-12">
				<h2 className="text-2xl font-bold text-gray-900 dark:text-white">
					Course not found
				</h2>
			</div>
		);
	}

	const getModuleIcon = (type) => {
		switch (type) {
			case "youtube":
				return <Youtube className="w-5 h-5 text-red-500" />;
			case "problem":
				return <Code className="w-5 h-5 text-green-500" />;
			default:
				return <FileText className="w-5 h-5 text-blue-500" />;
		}
	};

	return (
		<div className="max-w-7xl mx-auto p-6">
			{/* Back Button */}
			<button
				onClick={() => navigate("/courses")}
				className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-6 transition-colors"
			>
				<ArrowLeft className="w-5 h-5" />
				Back to Courses
			</button>

			<div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
				{/* Main Content */}
				<div className="lg:col-span-2">
					{/* Header */}
					<div className="mb-6">
						<div className="flex items-center gap-3 mb-3">
							<span
								className={`px-3 py-1 rounded-full text-sm font-semibold ${
									courseData.level === "Beginner"
										? "bg-blue-100 text-blue-700"
										: courseData.level === "Intermediate"
										? "bg-yellow-100 text-yellow-700"
										: "bg-red-100 text-red-700"
								}`}
							>
								{courseData.level}
							</span>
							{courseData.isEnrolled && (
								<span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-semibold flex items-center gap-1">
									<Award className="w-4 h-4" />
									Enrolled
								</span>
							)}
						</div>

						<h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
							{courseData.title}
						</h1>

						<p className="text-lg text-gray-600 dark:text-gray-400 mb-4">
							{courseData.description}
						</p>

						{/* Stats */}
						<div className="flex flex-wrap items-center gap-6 text-gray-600 dark:text-gray-400">
							<div className="flex items-center gap-2">
								<Play className="w-5 h-5" />
								<span>{courseData.totalModules} modules</span>
							</div>
							<div className="flex items-center gap-2">
								<Clock className="w-5 h-5" />
								<span>{courseData.totalDuration} minutes</span>
							</div>
							<div className="flex items-center gap-2">
								<Users className="w-5 h-5" />
								<span>{courseData.enrolledCount || 0} students</span>
							</div>
							<div className="flex items-center gap-2">
								<Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
								<span>4.8 (256 reviews)</span>
							</div>
						</div>

						{courseData.instructor && (
							<p className="text-gray-600 dark:text-gray-400 mt-4">
								Instructor:{" "}
								<span className="font-semibold">{courseData.instructor}</span>
							</p>
						)}
					</div>

					{/* Thumbnail */}
					<img
						src={courseData.thumbnail}
						alt={courseData.title}
						className="w-full h-80 object-cover rounded-lg mb-6"
					/>

					{/* Progress (if enrolled) */}
					{courseData.isEnrolled && courseData.enrollment && (
						<div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg p-6 text-white mb-6">
							<h3 className="text-lg font-semibold mb-3">Your Progress</h3>
							<div className="flex items-center justify-between mb-2">
								<span>{courseData.enrollment.progress}% Complete</span>
								<span>
									{courseData.enrollment.completedModules} /{" "}
									{courseData.totalModules} modules
								</span>
							</div>
							<div className="w-full bg-white/20 rounded-full h-3">
								<div
									className="bg-white rounded-full h-3 transition-all duration-500"
									style={{ width: `${courseData.enrollment.progress}%` }}
								/>
							</div>
						</div>
					)}

					{/* Course Content */}
					<div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
						<h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
							Course Content
						</h2>

						<div className="space-y-3">
							{courseData.modules &&
								courseData.modules.map((module, index) => (
									<div
										key={module._id}
										className={`border border-gray-200 dark:border-gray-700 rounded-lg p-4 ${
											module.locked ? "opacity-60" : ""
										}`}
									>
										<div className="flex items-start gap-3">
											<div className="flex-shrink-0 mt-1">
												{module.locked ? (
													<Lock className="w-5 h-5 text-gray-400" />
												) : courseData.isEnrolled ? (
													getModuleIcon(module.contentType)
												) : (
													<Lock className="w-5 h-5 text-gray-400" />
												)}
											</div>

											<div className="flex-1">
												<div className="flex items-start justify-between gap-4">
													<div>
														<h3 className="font-semibold text-gray-900 dark:text-white">
															{index + 1}. {module.title}
														</h3>
														<p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
															{module.description}
														</p>
													</div>
													<div className="flex items-center gap-2 text-sm text-gray-500 flex-shrink-0">
														<Clock className="w-4 h-4" />
														<span>{module.duration} min</span>
													</div>
												</div>

												{module.locked && (
													<p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
														<Lock className="w-3 h-3" />
														Enroll to unlock this content
													</p>
												)}
											</div>
										</div>
									</div>
								))}
						</div>
					</div>

					{/* Tags */}
					{courseData.tags && courseData.tags.length > 0 && (
						<div className="mt-6">
							<h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
								Tags
							</h3>
							<div className="flex flex-wrap gap-2">
								{courseData.tags.map((tag) => (
									<span
										key={tag}
										className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-sm"
									>
										{tag}
									</span>
								))}
							</div>
						</div>
					)}
				</div>

				{/* Sidebar */}
				<div className="lg:col-span-1">
					<div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 sticky top-6">
						{/* Price */}
						<div className="text-center mb-6">
							<div className="text-4xl font-bold text-indigo-600 dark:text-indigo-400 mb-2">
								₹{courseData.price}
							</div>
							<p className="text-sm text-gray-600 dark:text-gray-400">
								One-time payment
							</p>
						</div>

						{/* Action Button */}
						{courseData.isEnrolled ? (
							<Button
								onClick={handleStartLearning}
								className="w-full mb-4"
								size="lg"
							>
								<Play className="w-5 h-5 mr-2" />
								Continue Learning
							</Button>
						) : (
							<Button
								onClick={handleEnroll}
								className="w-full mb-4"
								size="lg"
								disabled={processingPayment}
							>
								{processingPayment ? (
									<>
										<LoadingSpinner size="sm" className="mr-2" />
										Processing...
									</>
								) : (
									<>
										<BookOpen className="w-5 h-5 mr-2" />
										Enroll Now
									</>
								)}
							</Button>
						)}

						{/* What's Included */}
						<div className="space-y-3 mb-6">
							<h3 className="font-semibold text-gray-900 dark:text-white">
								This course includes:
							</h3>
							<div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
								<div className="flex items-center gap-2">
									<CheckCircle className="w-4 h-4 text-green-500" />
									<span>{courseData.totalModules} comprehensive modules</span>
								</div>
								<div className="flex items-center gap-2">
									<CheckCircle className="w-4 h-4 text-green-500" />
									<span>Lifetime access</span>
								</div>
								<div className="flex items-center gap-2">
									<CheckCircle className="w-4 h-4 text-green-500" />
									<span>Practice problems</span>
								</div>
								<div className="flex items-center gap-2">
									<CheckCircle className="w-4 h-4 text-green-500" />
									<span>Certificate of completion</span>
								</div>
								<div className="flex items-center gap-2">
									<CheckCircle className="w-4 h-4 text-green-500" />
									<span>Progress tracking</span>
								</div>
							</div>
						</div>

						{/* Money-back guarantee */}
						<div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 text-center">
							<Award className="w-8 h-8 text-green-600 mx-auto mb-2" />
							<p className="text-sm text-green-800 dark:text-green-300 font-semibold">
								30-Day Money-Back Guarantee
							</p>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

export default CourseDetail;
