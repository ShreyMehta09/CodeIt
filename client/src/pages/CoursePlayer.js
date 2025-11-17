import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "react-query";
import { useParams, useNavigate } from "react-router-dom";
import {
	ChevronLeft,
	ChevronRight,
	CheckCircle,
	Circle,
	Clock,
	ArrowLeft,
	Youtube,
	FileText,
	Code,
	ExternalLink,
	Award,
	Trophy,
} from "lucide-react";
import axios from "axios";
import LoadingSpinner from "../components/UI/LoadingSpinner";
import Button from "../components/UI/Button";
import toast from "react-hot-toast";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

const CoursePlayer = () => {
	const { id } = useParams();
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const [currentModuleIndex, setCurrentModuleIndex] = useState(0);
	const [startTime, setStartTime] = useState(Date.now());

	// Fetch course with enrollment data
	const { data: courseData, isLoading } = useQuery(
		["course-player", id],
		async () => {
			const token = localStorage.getItem("token");
			const response = await axios.get(`${API_URL}/courses/${id}`, {
				headers: { Authorization: `Bearer ${token}` },
			});

			if (!response.data.isEnrolled) {
				throw new Error("Not enrolled in this course");
			}

			return response.data;
		},
		{
			onError: (error) => {
				toast.error(error.message || "Access denied");
				navigate(`/courses/${id}`);
			},
		}
	);

	// Update module progress
	const progressMutation = useMutation(
		async ({ moduleId, completed, timeSpent }) => {
			const token = localStorage.getItem("token");
			await axios.put(
				`${API_URL}/courses/${id}/modules/${moduleId}/progress`,
				{ completed, timeSpent },
				{ headers: { Authorization: `Bearer ${token}` } }
			);
		},
		{
			onSuccess: () => {
				queryClient.invalidateQueries(["course-player", id]);
			},
		}
	);

	// Track time when module changes
	useEffect(() => {
		setStartTime(Date.now());
	}, [currentModuleIndex]);

	// Auto-save progress every 30 seconds
	useEffect(() => {
		const interval = setInterval(() => {
			if (courseData?.modules?.[currentModuleIndex]) {
				const timeSpent = Math.floor((Date.now() - startTime) / 1000);
				const moduleId = courseData.modules[currentModuleIndex]._id;
				progressMutation.mutate({ moduleId, timeSpent });
			}
		}, 30000);

		return () => clearInterval(interval);
	}, [currentModuleIndex, courseData, startTime]);

	const currentModule = courseData?.modules?.[currentModuleIndex];

	const isModuleCompleted = (moduleId) => {
		const progress = courseData?.enrollment?.moduleProgress?.find(
			(p) => p.moduleId === moduleId
		);
		return progress?.completed || false;
	};

	const handleModuleComplete = async () => {
		if (!currentModule) return;

		const timeSpent = Math.floor((Date.now() - startTime) / 1000);

		await progressMutation.mutateAsync({
			moduleId: currentModule._id,
			completed: true,
			timeSpent,
		});

		toast.success("Module completed! 🎉");

		// Move to next module if available
		if (currentModuleIndex < courseData.modules.length - 1) {
			setTimeout(() => {
				setCurrentModuleIndex(currentModuleIndex + 1);
			}, 500);
		}
	};

	const handlePrevious = () => {
		if (currentModuleIndex > 0) {
			setCurrentModuleIndex(currentModuleIndex - 1);
		}
	};

	const handleNext = () => {
		if (currentModuleIndex < courseData.modules.length - 1) {
			setCurrentModuleIndex(currentModuleIndex + 1);
		}
	};

	const getYouTubeEmbedUrl = (url) => {
		const videoId = url.match(
			/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&]+)/
		)?.[1];
		return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
	};

	const renderModuleContent = () => {
		if (!currentModule) return null;

		switch (currentModule.contentType) {
			case "youtube":
				const embedUrl = getYouTubeEmbedUrl(currentModule.content);
				return (
					<div className="aspect-video w-full">
						{embedUrl ? (
							<iframe
								src={embedUrl}
								className="w-full h-full rounded-lg"
								allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
								allowFullScreen
								title={currentModule.title}
							/>
						) : (
							<div className="w-full h-full bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
								<div className="text-center">
									<Youtube className="w-16 h-16 text-gray-400 mx-auto mb-4" />
									<p className="text-gray-600 dark:text-gray-400">
										Invalid YouTube URL
									</p>
									<a
										href={currentModule.content}
										target="_blank"
										rel="noopener noreferrer"
										className="text-indigo-600 hover:underline flex items-center justify-center gap-2 mt-2"
									>
										Open in YouTube
										<ExternalLink className="w-4 h-4" />
									</a>
								</div>
							</div>
						)}
					</div>
				);

			case "problem":
				return (
					<div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg p-8 border border-green-200 dark:border-green-800">
						<div className="flex items-center gap-3 mb-6">
							<Code className="w-8 h-8 text-green-600" />
							<h3 className="text-2xl font-bold text-gray-900 dark:text-white">
								Practice Problem
							</h3>
						</div>

						<p className="text-gray-700 dark:text-gray-300 mb-6 text-lg">
							{currentModule.description}
						</p>

						<div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-green-200 dark:border-green-700">
							<h4 className="font-semibold text-gray-900 dark:text-white mb-4">
								Problem Link:
							</h4>
							<a
								href={currentModule.content}
								target="_blank"
								rel="noopener noreferrer"
								className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 font-medium text-lg"
							>
								{currentModule.content}
								<ExternalLink className="w-5 h-5" />
							</a>
						</div>

						<div className="mt-6 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
							<p className="text-sm text-yellow-800 dark:text-yellow-300">
								💡 <strong>Tip:</strong> Try to solve the problem on your own
								first. Mark as complete once you've successfully solved it!
							</p>
						</div>
					</div>
				);

			case "text":
			default:
				return (
					<div className="bg-white dark:bg-gray-800 rounded-lg p-8 border border-gray-200 dark:border-gray-700">
						<div className="flex items-center gap-3 mb-6">
							<FileText className="w-8 h-8 text-blue-600" />
							<h3 className="text-2xl font-bold text-gray-900 dark:text-white">
								{currentModule.title}
							</h3>
						</div>

						<div className="prose dark:prose-invert max-w-none">
							<div className="whitespace-pre-wrap text-gray-700 dark:text-gray-300 leading-relaxed">
								{currentModule.content}
							</div>
						</div>
					</div>
				);
		}
	};

	if (isLoading) {
		return (
			<div className="flex items-center justify-center h-64">
				<LoadingSpinner size="lg" />
			</div>
		);
	}

	if (!courseData) {
		return null;
	}

	const progress = courseData.enrollment?.progress || 0;
	const completedCount = courseData.enrollment?.completedModules || 0;
	const isCurrentCompleted =
		currentModule && isModuleCompleted(currentModule._id);
	const isCourseCompleted = progress === 100;

	return (
		<div className="h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
			{/* Header */}
			<div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-4">
						<button
							onClick={() => navigate(`/courses/${id}`)}
							className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
						>
							<ArrowLeft className="w-6 h-6" />
						</button>
						<div>
							<h1 className="text-xl font-bold text-gray-900 dark:text-white">
								{courseData.title}
							</h1>
							<p className="text-sm text-gray-600 dark:text-gray-400">
								{completedCount} / {courseData.modules.length} modules completed
							</p>
						</div>
					</div>

					<div className="flex items-center gap-4">
						{/* Progress */}
						<div className="flex items-center gap-3">
							<div className="w-48 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
								<div
									className="bg-indigo-600 rounded-full h-2 transition-all duration-500"
									style={{ width: `${progress}%` }}
								/>
							</div>
							<span className="text-sm font-semibold text-gray-900 dark:text-white">
								{progress}%
							</span>
						</div>

						{isCourseCompleted && (
							<div className="flex items-center gap-2 text-green-600">
								<Trophy className="w-5 h-5" />
								<span className="font-semibold">Completed!</span>
							</div>
						)}
					</div>
				</div>
			</div>

			<div className="flex-1 flex overflow-hidden">
				{/* Sidebar - Module List */}
				<div className="w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 overflow-y-auto">
					<div className="p-4">
						<h2 className="font-semibold text-gray-900 dark:text-white mb-4">
							Course Content
						</h2>

						<div className="space-y-2">
							{courseData.modules.map((module, index) => {
								const completed = isModuleCompleted(module._id);
								const isCurrent = index === currentModuleIndex;

								return (
									<button
										key={module._id}
										onClick={() => setCurrentModuleIndex(index)}
										className={`w-full text-left p-3 rounded-lg transition-colors ${
											isCurrent
												? "bg-indigo-100 dark:bg-indigo-900/30 border-2 border-indigo-500"
												: "hover:bg-gray-100 dark:hover:bg-gray-700 border-2 border-transparent"
										}`}
									>
										<div className="flex items-start gap-3">
											<div className="flex-shrink-0 mt-1">
												{completed ? (
													<CheckCircle className="w-5 h-5 text-green-500" />
												) : (
													<Circle className="w-5 h-5 text-gray-400" />
												)}
											</div>

											<div className="flex-1 min-w-0">
												<p
													className={`font-medium ${
														isCurrent
															? "text-indigo-700 dark:text-indigo-300"
															: "text-gray-900 dark:text-white"
													} truncate`}
												>
													{index + 1}. {module.title}
												</p>
												<div className="flex items-center gap-2 mt-1 text-xs text-gray-600 dark:text-gray-400">
													<Clock className="w-3 h-3" />
													<span>{module.duration} min</span>
												</div>
											</div>
										</div>
									</button>
								);
							})}
						</div>
					</div>
				</div>

				{/* Main Content */}
				<div className="flex-1 overflow-y-auto">
					<div className="max-w-5xl mx-auto p-8">
						{/* Module Header */}
						<div className="mb-6">
							<div className="flex items-center justify-between mb-3">
								<h2 className="text-3xl font-bold text-gray-900 dark:text-white">
									Module {currentModuleIndex + 1}: {currentModule?.title}
								</h2>
								{isCurrentCompleted && (
									<div className="flex items-center gap-2 text-green-600">
										<CheckCircle className="w-6 h-6" />
										<span className="font-semibold">Completed</span>
									</div>
								)}
							</div>
							<p className="text-gray-600 dark:text-gray-400 text-lg">
								{currentModule?.description}
							</p>
						</div>

						{/* Module Content */}
						<div className="mb-8">{renderModuleContent()}</div>

						{/* Navigation */}
						<div className="flex items-center justify-between pt-6 border-t border-gray-200 dark:border-gray-700">
							<Button
								onClick={handlePrevious}
								variant="secondary"
								disabled={currentModuleIndex === 0}
							>
								<ChevronLeft className="w-5 h-5 mr-2" />
								Previous
							</Button>

							<div className="flex gap-3">
								{!isCurrentCompleted && (
									<Button
										onClick={handleModuleComplete}
										disabled={progressMutation.isLoading}
									>
										<CheckCircle className="w-5 h-5 mr-2" />
										Mark as Complete
									</Button>
								)}

								<Button
									onClick={handleNext}
									disabled={
										currentModuleIndex === courseData.modules.length - 1
									}
								>
									Next
									<ChevronRight className="w-5 h-5 ml-2" />
								</Button>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

export default CoursePlayer;
