import React, { useState, useEffect } from "react";
import {
	X,
	Plus,
	Trash2,
	MoveUp,
	MoveDown,
	Youtube,
	FileText,
	Code,
} from "lucide-react";
import { useMutation, useQuery } from "react-query";
import axios from "axios";
import Button from "./Button";
import LoadingSpinner from "./LoadingSpinner";
import toast from "react-hot-toast";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

const CreateCourseModal = ({ course, onClose, onSuccess }) => {
	const [step, setStep] = useState(1);
	const [formData, setFormData] = useState({
		title: "",
		description: "",
		instructor: "Admin",
		thumbnail:
			"https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800",
		price: 0,
		currency: "INR",
		level: "Beginner",
		tags: [],
		moduleCount: 1,
		modules: [],
	});

	const [tagInput, setTagInput] = useState("");

	// Fetch problems for problem-type modules
	const { data: problems } = useQuery("global-problems", async () => {
		const token = localStorage.getItem("token");
		const response = await axios.get(`${API_URL}/problems`, {
			headers: { Authorization: `Bearer ${token}` },
		});
		return response.data;
	});

	// Initialize form when editing
	useEffect(() => {
		if (course) {
			setFormData({
				title: course.title,
				description: course.description,
				instructor: course.instructor,
				thumbnail: course.thumbnail,
				price: course.price,
				currency: course.currency,
				level: course.level,
				tags: course.tags || [],
				moduleCount: course.modules?.length || 1,
				modules: course.modules || [],
			});
			if (course.modules && course.modules.length > 0) {
				setStep(2); // Skip to module step if editing with modules
			}
		}
	}, [course]);

	// Initialize modules when module count changes
	useEffect(() => {
		if (formData.moduleCount > 0 && formData.modules.length === 0) {
			const initialModules = Array.from(
				{ length: formData.moduleCount },
				(_, i) => ({
					title: "",
					description: "",
					order: i + 1,
					contentType: "text",
					content: "",
					problemId: "",
					duration: 10,
				})
			);
			setFormData((prev) => ({ ...prev, modules: initialModules }));
		}
	}, [formData.moduleCount, formData.modules.length]);

	// Create/Update mutation
	const mutation = useMutation(
		async (data) => {
			const token = localStorage.getItem("token");
			const url = course
				? `${API_URL}/admin/courses/${course._id}`
				: `${API_URL}/admin/courses`;
			const method = course ? "put" : "post";

			const response = await axios[method](url, data, {
				headers: { Authorization: `Bearer ${token}` },
			});
			return response.data;
		},
		{
			onSuccess: () => {
				toast.success(
					course
						? "Course updated successfully!"
						: "Course created successfully!"
				);
				onSuccess();
			},
			onError: (error) => {
				toast.error(error.response?.data?.message || "Failed to save course");
			},
		}
	);

	const handleChange = (e) => {
		const { name, value } = e.target;
		setFormData((prev) => ({ ...prev, [name]: value }));
	};

	const handleModuleChange = (index, field, value) => {
		const newModules = [...formData.modules];
		newModules[index][field] = value;

		// If changing content type, reset content and problemId
		if (field === "contentType") {
			newModules[index].content = "";
			newModules[index].problemId = "";
		}

		setFormData((prev) => ({ ...prev, modules: newModules }));
	};

	const addModule = () => {
		const newModule = {
			title: "",
			description: "",
			order: formData.modules.length + 1,
			contentType: "text",
			content: "",
			problemId: "",
			duration: 10,
		};
		setFormData((prev) => ({
			...prev,
			modules: [...prev.modules, newModule],
			moduleCount: prev.modules.length + 1,
		}));
	};

	const removeModule = (index) => {
		const newModules = formData.modules.filter((_, i) => i !== index);
		// Reorder
		newModules.forEach((mod, i) => {
			mod.order = i + 1;
		});
		setFormData((prev) => ({
			...prev,
			modules: newModules,
			moduleCount: newModules.length,
		}));
	};

	const moveModule = (index, direction) => {
		const newModules = [...formData.modules];
		const targetIndex = direction === "up" ? index - 1 : index + 1;

		if (targetIndex < 0 || targetIndex >= newModules.length) return;

		[newModules[index], newModules[targetIndex]] = [
			newModules[targetIndex],
			newModules[index],
		];

		// Update order numbers
		newModules.forEach((mod, i) => {
			mod.order = i + 1;
		});

		setFormData((prev) => ({ ...prev, modules: newModules }));
	};

	const addTag = () => {
		if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
			setFormData((prev) => ({
				...prev,
				tags: [...prev.tags, tagInput.trim()],
			}));
			setTagInput("");
		}
	};

	const removeTag = (tag) => {
		setFormData((prev) => ({
			...prev,
			tags: prev.tags.filter((t) => t !== tag),
		}));
	};

	const handleSubmit = (e) => {
		e.preventDefault();

		// Validation
		if (!formData.title || !formData.description || formData.price < 0) {
			toast.error("Please fill in all required fields");
			return;
		}

		if (formData.modules.length === 0) {
			toast.error("Please add at least one module");
			return;
		}

		// Validate all modules
		for (let i = 0; i < formData.modules.length; i++) {
			const module = formData.modules[i];
			if (!module.title || !module.description) {
				toast.error(`Module ${i + 1}: Title and description are required`);
				return;
			}
			if (module.contentType === "text" || module.contentType === "youtube") {
				if (!module.content || !module.content.trim()) {
					toast.error(`Module ${i + 1}: Content is required`);
					return;
				}
			}
			if (module.contentType === "problem" && !module.problemId) {
				toast.error(`Module ${i + 1}: Please select a problem`);
				return;
			}
		}

		// Prepare data for submission - ensure problem type modules have content set
		const submitData = {
			...formData,
			modules: formData.modules.map((module) => ({
				...module,
				content:
					module.contentType === "problem" && !module.content
						? problems?.find((p) => p._id === module.problemId)?.url || ""
						: module.content,
			})),
		};

		mutation.mutate(submitData);
	};

	const nextStep = () => {
		if (step === 1) {
			if (!formData.title || !formData.description) {
				toast.error("Please fill in course details");
				return;
			}
			if (formData.moduleCount < 1) {
				toast.error("Please specify at least 1 module");
				return;
			}
			setStep(2);
		}
	};

	return (
		<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
			<div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
				{/* Header */}
				<div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 flex items-center justify-between z-10">
					<div>
						<h2 className="text-2xl font-bold text-gray-900 dark:text-white">
							{course ? "Edit Course" : "Create New Course"}
						</h2>
						<p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
							Step {step} of 2:{" "}
							{step === 1 ? "Course Details" : "Module Content"}
						</p>
					</div>
					<button
						onClick={onClose}
						className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
					>
						<X className="w-6 h-6" />
					</button>
				</div>

				<form onSubmit={handleSubmit}>
					{/* Step 1: Course Details */}
					{step === 1 && (
						<div className="p-6 space-y-6">
							<div>
								<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
									Course Title *
								</label>
								<input
									type="text"
									name="title"
									value={formData.title}
									onChange={handleChange}
									className="input w-full"
									placeholder="e.g., Complete DSA Masterclass"
									required
								/>
							</div>

							<div>
								<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
									Description *
								</label>
								<textarea
									name="description"
									value={formData.description}
									onChange={handleChange}
									className="input w-full h-24"
									placeholder="Describe what students will learn..."
									required
								/>
							</div>

							<div className="grid grid-cols-2 gap-4">
								<div>
									<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
										Instructor Name
									</label>
									<input
										type="text"
										name="instructor"
										value={formData.instructor}
										onChange={handleChange}
										className="input w-full"
										placeholder="Admin"
									/>
								</div>

								<div>
									<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
										Level
									</label>
									<select
										name="level"
										value={formData.level}
										onChange={handleChange}
										className="input w-full"
									>
										<option value="Beginner">Beginner</option>
										<option value="Intermediate">Intermediate</option>
										<option value="Advanced">Advanced</option>
									</select>
								</div>
							</div>

							<div className="grid grid-cols-2 gap-4">
								<div>
									<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
										Price (₹) *
									</label>
									<input
										type="number"
										name="price"
										value={formData.price}
										onChange={handleChange}
										className="input w-full"
										min="0"
										step="1"
										required
									/>
								</div>

								<div>
									<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
										Number of Modules *
									</label>
									<input
										type="number"
										name="moduleCount"
										value={formData.moduleCount}
										onChange={handleChange}
										className="input w-full"
										min="1"
										max="50"
										required
									/>
								</div>
							</div>

							<div>
								<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
									Thumbnail URL
								</label>
								<input
									type="url"
									name="thumbnail"
									value={formData.thumbnail}
									onChange={handleChange}
									className="input w-full"
									placeholder="https://..."
								/>
								{formData.thumbnail && (
									<img
										src={formData.thumbnail}
										alt="Thumbnail preview"
										className="mt-2 w-full h-40 object-cover rounded-lg"
									/>
								)}
							</div>

							<div>
								<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
									Tags
								</label>
								<div className="flex gap-2 mb-2">
									<input
										type="text"
										value={tagInput}
										onChange={(e) => setTagInput(e.target.value)}
										onKeyPress={(e) =>
											e.key === "Enter" && (e.preventDefault(), addTag())
										}
										className="input flex-1"
										placeholder="Add a tag..."
									/>
									<Button type="button" onClick={addTag} variant="secondary">
										Add
									</Button>
								</div>
								<div className="flex flex-wrap gap-2">
									{formData.tags.map((tag) => (
										<span
											key={tag}
											className="px-3 py-1 bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 rounded-full text-sm flex items-center gap-2"
										>
											{tag}
											<button
												type="button"
												onClick={() => removeTag(tag)}
												className="hover:text-indigo-900"
											>
												<X className="w-3 h-3" />
											</button>
										</span>
									))}
								</div>
							</div>

							<div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
								<Button type="button" variant="secondary" onClick={onClose}>
									Cancel
								</Button>
								<Button type="button" onClick={nextStep}>
									Next: Add Modules
								</Button>
							</div>
						</div>
					)}

					{/* Step 2: Modules */}
					{step === 2 && (
						<div className="p-6 space-y-6">
							<div className="flex items-center justify-between mb-4">
								<h3 className="text-lg font-semibold text-gray-900 dark:text-white">
									Course Modules ({formData.modules.length})
								</h3>
								<Button
									type="button"
									onClick={addModule}
									size="sm"
									className="flex items-center gap-2"
								>
									<Plus className="w-4 h-4" />
									Add Module
								</Button>
							</div>

							<div className="space-y-4">
								{formData.modules.map((module, index) => (
									<div
										key={index}
										className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-700/50"
									>
										<div className="flex items-center justify-between mb-3">
											<h4 className="font-semibold text-gray-900 dark:text-white">
												Module {index + 1}
											</h4>
											<div className="flex items-center gap-2">
												{index > 0 && (
													<button
														type="button"
														onClick={() => moveModule(index, "up")}
														className="p-1 text-gray-400 hover:text-gray-600"
														title="Move up"
													>
														<MoveUp className="w-4 h-4" />
													</button>
												)}
												{index < formData.modules.length - 1 && (
													<button
														type="button"
														onClick={() => moveModule(index, "down")}
														className="p-1 text-gray-400 hover:text-gray-600"
														title="Move down"
													>
														<MoveDown className="w-4 h-4" />
													</button>
												)}
												<button
													type="button"
													onClick={() => removeModule(index)}
													className="p-1 text-red-400 hover:text-red-600"
													title="Remove"
												>
													<Trash2 className="w-4 h-4" />
												</button>
											</div>
										</div>

										<div className="space-y-3">
											<input
												type="text"
												value={module.title}
												onChange={(e) =>
													handleModuleChange(index, "title", e.target.value)
												}
												className="input w-full"
												placeholder="Module title"
												required
											/>

											<textarea
												value={module.description}
												onChange={(e) =>
													handleModuleChange(
														index,
														"description",
														e.target.value
													)
												}
												className="input w-full h-20"
												placeholder="Module description"
												required
											/>

											<div className="grid grid-cols-2 gap-3">
												<div>
													<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
														Content Type
													</label>
													<select
														value={module.contentType}
														onChange={(e) =>
															handleModuleChange(
																index,
																"contentType",
																e.target.value
															)
														}
														className="input w-full"
													>
														<option value="text">Text</option>
														<option value="youtube">YouTube Video</option>
														<option value="problem">Problem</option>
													</select>
												</div>

												<div>
													<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
														Duration (mins)
													</label>
													<input
														type="number"
														value={module.duration}
														onChange={(e) =>
															handleModuleChange(
																index,
																"duration",
																parseInt(e.target.value)
															)
														}
														className="input w-full"
														min="1"
													/>
												</div>
											</div>

											{module.contentType === "text" && (
												<div>
													<label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
														<FileText className="w-4 h-4" />
														Text Content
													</label>
													<textarea
														value={module.content}
														onChange={(e) =>
															handleModuleChange(
																index,
																"content",
																e.target.value
															)
														}
														className="input w-full h-32 font-mono text-sm"
														placeholder="Write your content here (supports Markdown)..."
														required
													/>
												</div>
											)}

											{module.contentType === "youtube" && (
												<div>
													<label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
														<Youtube className="w-4 h-4" />
														YouTube Video URL
													</label>
													<input
														type="url"
														value={module.content}
														onChange={(e) =>
															handleModuleChange(
																index,
																"content",
																e.target.value
															)
														}
														className="input w-full"
														placeholder="https://www.youtube.com/watch?v=..."
														required
													/>
												</div>
											)}

											{module.contentType === "problem" && (
												<div>
													<label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
														<Code className="w-4 h-4" />
														Select Problem
													</label>
													<select
														value={module.problemId}
														onChange={(e) => {
															handleModuleChange(
																index,
																"problemId",
																e.target.value
															);
															const problem = problems?.find(
																(p) => p._id === e.target.value
															);
															if (problem) {
																handleModuleChange(
																	index,
																	"content",
																	problem.url
																);
															}
														}}
														className="input w-full"
														required
													>
														<option value="">Select a problem...</option>
														{problems?.map((problem) => (
															<option key={problem._id} value={problem._id}>
																{problem.title} ({problem.platform} -{" "}
																{problem.difficulty})
															</option>
														))}
													</select>
												</div>
											)}
										</div>
									</div>
								))}
							</div>

							<div className="flex justify-between gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
								<Button
									type="button"
									variant="secondary"
									onClick={() => setStep(1)}
								>
									Back
								</Button>
								<div className="flex gap-3">
									<Button type="button" variant="secondary" onClick={onClose}>
										Cancel
									</Button>
									<Button type="submit" disabled={mutation.isLoading}>
										{mutation.isLoading ? (
											<>
												<LoadingSpinner size="sm" />
												Saving...
											</>
										) : course ? (
											"Update Course"
										) : (
											"Create Course"
										)}
									</Button>
								</div>
							</div>
						</div>
					)}
				</form>
			</div>
		</div>
	);
};

export default CreateCourseModal;
