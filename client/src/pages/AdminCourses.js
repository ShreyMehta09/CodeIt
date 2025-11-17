import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "react-query";
import {
	BookOpen,
	Plus,
	Edit2,
	Trash2,
	Eye,
	EyeOff,
	Users,
	DollarSign,
	Clock,
	Play,
	TrendingUp,
} from "lucide-react";
import axios from "axios";
import Button from "../components/UI/Button";
import LoadingSpinner from "../components/UI/LoadingSpinner";
import CreateCourseModal from "../components/UI/CreateCourseModal";
import toast from "react-hot-toast";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

const AdminCourses = () => {
	const [showCreateModal, setShowCreateModal] = useState(false);
	const [editingCourse, setEditingCourse] = useState(null);
	const queryClient = useQueryClient();

	// Fetch all courses
	const { data: courses, isLoading } = useQuery("admin-courses", async () => {
		const token = localStorage.getItem("token");
		const response = await axios.get(`${API_URL}/admin/courses`, {
			headers: { Authorization: `Bearer ${token}` },
		});
		return response.data;
	});

	// Toggle publish status
	const togglePublishMutation = useMutation(
		async (courseId) => {
			const token = localStorage.getItem("token");
			await axios.patch(
				`${API_URL}/admin/courses/${courseId}/publish`,
				{},
				{ headers: { Authorization: `Bearer ${token}` } }
			);
		},
		{
			onSuccess: () => {
				queryClient.invalidateQueries("admin-courses");
				toast.success("Course status updated");
			},
			onError: () => {
				toast.error("Failed to update course status");
			},
		}
	);

	// Delete course
	const deleteMutation = useMutation(
		async (courseId) => {
			const token = localStorage.getItem("token");
			await axios.delete(`${API_URL}/admin/courses/${courseId}`, {
				headers: { Authorization: `Bearer ${token}` },
			});
		},
		{
			onSuccess: () => {
				queryClient.invalidateQueries("admin-courses");
				toast.success("Course deleted successfully");
			},
			onError: (error) => {
				toast.error(error.response?.data?.message || "Failed to delete course");
			},
		}
	);

	const handleDelete = (course) => {
		if (window.confirm(`Are you sure you want to delete "${course.title}"?`)) {
			deleteMutation.mutate(course._id);
		}
	};

	const handleEdit = (course) => {
		setEditingCourse(course);
		setShowCreateModal(true);
	};

	const closeModal = () => {
		setShowCreateModal(false);
		setEditingCourse(null);
	};

	if (isLoading) {
		return (
			<div className="flex items-center justify-center h-64">
				<LoadingSpinner size="lg" />
			</div>
		);
	}

	return (
		<div className="p-6">
			{/* Header */}
			<div className="mb-6 flex items-center justify-between">
				<div>
					<h1 className="text-2xl font-bold text-gray-900 dark:text-white">
						Course Management
					</h1>
					<p className="text-gray-600 dark:text-gray-400 mt-1">
						Create and manage courses with modules and content
					</p>
				</div>
				<Button
					onClick={() => setShowCreateModal(true)}
					className="flex items-center gap-2"
				>
					<Plus className="w-4 h-4" />
					Create Course
				</Button>
			</div>

			{/* Stats Overview */}
			<div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
				<div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
					<div className="flex items-center justify-between">
						<div>
							<p className="text-sm text-gray-600 dark:text-gray-400">
								Total Courses
							</p>
							<p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
								{courses?.length || 0}
							</p>
						</div>
						<BookOpen className="w-8 h-8 text-indigo-600" />
					</div>
				</div>

				<div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
					<div className="flex items-center justify-between">
						<div>
							<p className="text-sm text-gray-600 dark:text-gray-400">
								Published
							</p>
							<p className="text-2xl font-bold text-green-600 mt-1">
								{courses?.filter((c) => c.isPublished).length || 0}
							</p>
						</div>
						<Eye className="w-8 h-8 text-green-600" />
					</div>
				</div>

				<div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
					<div className="flex items-center justify-between">
						<div>
							<p className="text-sm text-gray-600 dark:text-gray-400">
								Total Enrollments
							</p>
							<p className="text-2xl font-bold text-blue-600 mt-1">
								{courses?.reduce((sum, c) => sum + (c.enrolledCount || 0), 0) ||
									0}
							</p>
						</div>
						<Users className="w-8 h-8 text-blue-600" />
					</div>
				</div>

				<div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
					<div className="flex items-center justify-between">
						<div>
							<p className="text-sm text-gray-600 dark:text-gray-400">
								Total Revenue
							</p>
							<p className="text-2xl font-bold text-purple-600 mt-1">
								₹
								{courses
									?.reduce(
										(sum, c) => sum + c.price * (c.enrolledCount || 0),
										0
									)
									.toLocaleString() || 0}
							</p>
						</div>
						<DollarSign className="w-8 h-8 text-purple-600" />
					</div>
				</div>
			</div>

			{/* Courses List */}
			<div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
				{!courses || courses.length === 0 ? (
					<div className="p-12 text-center">
						<BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
						<h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
							No courses yet
						</h3>
						<p className="text-gray-600 dark:text-gray-400 mb-4">
							Create your first course to get started
						</p>
						<Button onClick={() => setShowCreateModal(true)}>
							<Plus className="w-4 h-4 mr-2" />
							Create Course
						</Button>
					</div>
				) : (
					<div className="divide-y divide-gray-200 dark:divide-gray-700">
						{courses.map((course) => (
							<div
								key={course._id}
								className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
							>
								<div className="flex items-start gap-4">
									{/* Thumbnail */}
									<img
										src={course.thumbnail}
										alt={course.title}
										className="w-32 h-20 object-cover rounded-lg flex-shrink-0"
									/>

									{/* Course Info */}
									<div className="flex-1 min-w-0">
										<div className="flex items-start justify-between gap-4">
											<div className="flex-1">
												<div className="flex items-center gap-2 mb-2">
													<h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
														{course.title}
													</h3>
													<span
														className={`px-2 py-1 text-xs font-medium rounded-full ${
															course.isPublished
																? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
																: "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
														}`}
													>
														{course.isPublished ? "Published" : "Draft"}
													</span>
													<span
														className={`px-2 py-1 text-xs font-medium rounded-full ${
															course.level === "Beginner"
																? "bg-blue-100 text-blue-700"
																: course.level === "Intermediate"
																? "bg-yellow-100 text-yellow-700"
																: "bg-red-100 text-red-700"
														}`}
													>
														{course.level}
													</span>
												</div>
												<p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
													{course.description}
												</p>

												<div className="flex items-center gap-6 text-sm text-gray-600 dark:text-gray-400">
													<div className="flex items-center gap-1">
														<Play className="w-4 h-4" />
														<span>{course.totalModules} modules</span>
													</div>
													<div className="flex items-center gap-1">
														<Clock className="w-4 h-4" />
														<span>{course.totalDuration} mins</span>
													</div>
													<div className="flex items-center gap-1">
														<Users className="w-4 h-4" />
														<span>{course.enrolledCount || 0} enrolled</span>
													</div>
													<div className="flex items-center gap-1">
														<DollarSign className="w-4 h-4" />
														<span className="font-semibold">
															₹{course.price}
														</span>
													</div>
												</div>
											</div>

											{/* Actions */}
											<div className="flex items-center gap-2 flex-shrink-0">
												<button
													onClick={() =>
														togglePublishMutation.mutate(course._id)
													}
													className="p-2 text-gray-600 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400 transition-colors"
													title={course.isPublished ? "Unpublish" : "Publish"}
												>
													{course.isPublished ? (
														<EyeOff className="w-5 h-5" />
													) : (
														<Eye className="w-5 h-5" />
													)}
												</button>
												<button
													onClick={() => handleEdit(course)}
													className="p-2 text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors"
													title="Edit"
												>
													<Edit2 className="w-5 h-5" />
												</button>
												<button
													onClick={() => handleDelete(course)}
													className="p-2 text-gray-600 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 transition-colors"
													title="Delete"
													disabled={deleteMutation.isLoading}
												>
													<Trash2 className="w-5 h-5" />
												</button>
											</div>
										</div>
									</div>
								</div>
							</div>
						))}
					</div>
				)}
			</div>

			{/* Create/Edit Course Modal */}
			{showCreateModal && (
				<CreateCourseModal
					course={editingCourse}
					onClose={closeModal}
					onSuccess={() => {
						closeModal();
						queryClient.invalidateQueries("admin-courses");
					}}
				/>
			)}
		</div>
	);
};

export default AdminCourses;
