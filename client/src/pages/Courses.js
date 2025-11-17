import React, { useState } from "react";
import { useQuery } from "react-query";
import { useNavigate } from "react-router-dom";
import {
	BookOpen,
	Search,
	Filter,
	Clock,
	Users,
	DollarSign,
	Star,
	Play,
	TrendingUp,
	Award,
} from "lucide-react";
import axios from "axios";
import LoadingSpinner from "../components/UI/LoadingSpinner";
import Button from "../components/UI/Button";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

const Courses = () => {
	const navigate = useNavigate();
	const [searchTerm, setSearchTerm] = useState("");
	const [selectedLevel, setSelectedLevel] = useState("all");
	const [sortBy, setSortBy] = useState("newest");

	// Fetch all published courses
	const { data: courses, isLoading } = useQuery(
		["courses", searchTerm, selectedLevel, sortBy],
		async () => {
			const params = new URLSearchParams();
			if (searchTerm) params.append("search", searchTerm);
			if (selectedLevel !== "all") params.append("level", selectedLevel);
			params.append("sort", sortBy);

			const response = await axios.get(
				`${API_URL}/courses?${params.toString()}`
			);
			return response.data;
		}
	);

	// Fetch user's enrolled courses
	const { data: enrolledCourses } = useQuery("enrolled-courses", async () => {
		const token = localStorage.getItem("token");
		if (!token) return [];

		const response = await axios.get(`${API_URL}/courses/my/enrolled`, {
			headers: { Authorization: `Bearer ${token}` },
		});
		return response.data;
	});

	const isEnrolled = (courseId) => {
		return enrolledCourses?.some((e) => e.courseId._id === courseId);
	};

	const handleCourseClick = (courseId) => {
		navigate(`/courses/${courseId}`);
	};

	if (isLoading) {
		return (
			<div className="flex items-center justify-center h-64">
				<LoadingSpinner size="lg" />
			</div>
		);
	}

	return (
		<div className="max-w-7xl mx-auto p-6">
			{/* Header */}
			<div className="mb-8">
				<h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
					Browse Courses
				</h1>
				<p className="text-gray-600 dark:text-gray-400">
					Learn from expert-curated courses and advance your coding skills
				</p>
			</div>

			{/* Search and Filters */}
			<div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 mb-6">
				<div className="flex flex-col md:flex-row gap-4">
					{/* Search */}
					<div className="flex-1 relative">
						<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
						<input
							type="text"
							placeholder="Search courses..."
							value={searchTerm}
							onChange={(e) => setSearchTerm(e.target.value)}
							className="input w-full pl-10"
						/>
					</div>

					{/* Level Filter */}
					<div className="relative">
						<Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
						<select
							value={selectedLevel}
							onChange={(e) => setSelectedLevel(e.target.value)}
							className="input pl-10 pr-8"
						>
							<option value="all">All Levels</option>
							<option value="Beginner">Beginner</option>
							<option value="Intermediate">Intermediate</option>
							<option value="Advanced">Advanced</option>
						</select>
					</div>

					{/* Sort */}
					<select
						value={sortBy}
						onChange={(e) => setSortBy(e.target.value)}
						className="input"
					>
						<option value="newest">Newest First</option>
						<option value="popular">Most Popular</option>
						<option value="price_asc">Price: Low to High</option>
						<option value="price_desc">Price: High to Low</option>
						<option value="title">Title: A-Z</option>
					</select>
				</div>
			</div>

			{/* Stats */}
			<div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
				<div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg p-4 text-white">
					<div className="flex items-center justify-between">
						<div>
							<p className="text-indigo-100 text-sm">Available Courses</p>
							<p className="text-3xl font-bold mt-1">{courses?.length || 0}</p>
						</div>
						<BookOpen className="w-12 h-12 text-indigo-200" />
					</div>
				</div>

				<div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-4 text-white">
					<div className="flex items-center justify-between">
						<div>
							<p className="text-green-100 text-sm">Your Enrollments</p>
							<p className="text-3xl font-bold mt-1">
								{enrolledCourses?.length || 0}
							</p>
						</div>
						<Award className="w-12 h-12 text-green-200" />
					</div>
				</div>

				<div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg p-4 text-white">
					<div className="flex items-center justify-between">
						<div>
							<p className="text-purple-100 text-sm">Total Students</p>
							<p className="text-3xl font-bold mt-1">
								{courses?.reduce((sum, c) => sum + (c.enrolledCount || 0), 0) ||
									0}
							</p>
						</div>
						<Users className="w-12 h-12 text-purple-200" />
					</div>
				</div>
			</div>

			{/* Courses Grid */}
			{!courses || courses.length === 0 ? (
				<div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-12 text-center">
					<BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
					<h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
						No courses found
					</h3>
					<p className="text-gray-600 dark:text-gray-400">
						{searchTerm || selectedLevel !== "all"
							? "Try adjusting your filters"
							: "Check back soon for new courses"}
					</p>
				</div>
			) : (
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
					{courses.map((course) => (
						<div
							key={course._id}
							onClick={() => handleCourseClick(course._id)}
							className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg transition-all cursor-pointer group"
						>
							{/* Thumbnail */}
							<div className="relative h-48 overflow-hidden">
								<img
									src={course.thumbnail}
									alt={course.title}
									className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
								/>
								{isEnrolled(course._id) && (
									<div className="absolute top-3 right-3 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
										<Award className="w-3 h-3" />
										Enrolled
									</div>
								)}
								<div className="absolute bottom-3 left-3">
									<span
										className={`px-3 py-1 rounded-full text-xs font-semibold ${
											course.level === "Beginner"
												? "bg-blue-500 text-white"
												: course.level === "Intermediate"
												? "bg-yellow-500 text-white"
												: "bg-red-500 text-white"
										}`}
									>
										{course.level}
									</span>
								</div>
							</div>

							{/* Content */}
							<div className="p-5">
								<h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 line-clamp-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
									{course.title}
								</h3>

								<p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
									{course.description}
								</p>

								{/* Stats */}
								<div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mb-4">
									<div className="flex items-center gap-1">
										<Play className="w-4 h-4" />
										<span>{course.totalModules} modules</span>
									</div>
									<div className="flex items-center gap-1">
										<Clock className="w-4 h-4" />
										<span>{course.totalDuration} mins</span>
									</div>
								</div>

								<div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mb-4">
									<div className="flex items-center gap-1">
										<Users className="w-4 h-4" />
										<span>{course.enrolledCount || 0} students</span>
									</div>
									{course.instructor && (
										<div className="flex items-center gap-1 truncate">
											<span className="truncate">by {course.instructor}</span>
										</div>
									)}
								</div>

								{/* Tags */}
								{course.tags && course.tags.length > 0 && (
									<div className="flex flex-wrap gap-2 mb-4">
										{course.tags.slice(0, 3).map((tag) => (
											<span
												key={tag}
												className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-xs"
											>
												{tag}
											</span>
										))}
									</div>
								)}

								{/* Footer */}
								<div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
									<div className="flex items-center gap-1 text-2xl font-bold text-indigo-600 dark:text-indigo-400">
										₹{course.price}
									</div>
									<Button
										size="sm"
										variant={isEnrolled(course._id) ? "secondary" : "primary"}
										onClick={(e) => {
											e.stopPropagation();
											handleCourseClick(course._id);
										}}
									>
										{isEnrolled(course._id)
											? "Continue Learning"
											: "View Course"}
									</Button>
								</div>
							</div>
						</div>
					))}
				</div>
			)}
		</div>
	);
};

export default Courses;
