import React, { useState, useEffect } from "react";
import { useQueryClient } from "react-query";
import {
	Plus,
	Search,
	Filter,
	ExternalLink,
	Trash2,
	Edit2,
} from "lucide-react";
import Button from "../components/UI/Button";
import Badge from "../components/UI/Badge";
import LoadingSpinner from "../components/UI/LoadingSpinner";
import api from "../utils/api";

const Problems = () => {
	const queryClient = useQueryClient();
	const [problems, setProblems] = useState([]);
	const [loading, setLoading] = useState(true);
	const [searchQuery, setSearchQuery] = useState("");
	const [selectedStatus, setSelectedStatus] = useState("all");
	const [selectedDifficulty, setSelectedDifficulty] = useState("all");
	const [selectedPlatform, setSelectedPlatform] = useState("all");
	const [selectedTags, setSelectedTags] = useState([]);
	const [showAddModal, setShowAddModal] = useState(false);
	const [editingProblem, setEditingProblem] = useState(null);
	const [currentPage, setCurrentPage] = useState(1);
	const [totalPages, setTotalPages] = useState(1);
	const [totalProblems, setTotalProblems] = useState(0);
	const problemsPerPage = 10;
	const [formData, setFormData] = useState({
		title: "",
		platform: "leetcode",
		problemId: "",
		url: "",
		difficulty: "easy",
		tags: "",
		notes: "",
	});

	useEffect(() => {
		fetchProblems();
	}, [currentPage]);

	const fetchProblems = async () => {
		try {
			setLoading(true);
			const params = new URLSearchParams();
			params.append("page", currentPage);
			params.append("limit", problemsPerPage);
			if (selectedStatus !== "all") params.append("status", selectedStatus);
			if (selectedDifficulty !== "all")
				params.append("difficulty", selectedDifficulty);
			if (selectedPlatform !== "all")
				params.append("platform", selectedPlatform);
			if (selectedTags.length > 0)
				params.append("tags", selectedTags.join(","));
			if (searchQuery) params.append("search", searchQuery);

			const response = await api.get(`/problems?${params.toString()}`);
			setProblems(response.data.problems || []);
			setTotalPages(response.data.totalPages || 1);
			setTotalProblems(response.data.total || 0);
		} catch (error) {
			console.error("Error fetching problems:", error);
			alert("Failed to fetch problems");
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		setCurrentPage(1);
	}, [
		searchQuery,
		selectedStatus,
		selectedDifficulty,
		selectedPlatform,
		selectedTags,
	]);

	useEffect(() => {
		const timeoutId = setTimeout(() => {
			fetchProblems();
		}, 300);
		return () => clearTimeout(timeoutId);
	}, [
		currentPage,
		searchQuery,
		selectedStatus,
		selectedDifficulty,
		selectedPlatform,
		selectedTags,
	]);

	const handleAddProblem = async (e) => {
		e.preventDefault();
		try {
			const tagsArray = formData.tags
				.split(",")
				.map((t) => t.trim())
				.filter((t) => t);
			const payload = {
				...formData,
				tags: tagsArray,
			};

			if (editingProblem) {
				await api.put(`/problems/${editingProblem._id}`, payload);
			} else {
				await api.post("/problems", payload);
			}

			setShowAddModal(false);
			setEditingProblem(null);
			setFormData({
				title: "",
				platform: "leetcode",
				problemId: "",
				url: "",
				difficulty: "easy",
				tags: "",
				notes: "",
			});
			fetchProblems();
		} catch (error) {
			console.error("Error saving problem:", error);
			alert(error.response?.data?.message || "Failed to save problem");
		}
	};

	const handleStatusChange = async (problemId, newStatus) => {
		try {
			await api.put(`/problems/${problemId}`, { status: newStatus });
			fetchProblems();
			// Invalidate dashboard cache to update stats
			queryClient.invalidateQueries("dashboard");
		} catch (error) {
			console.error("Error updating status:", error);
			alert("Failed to update status");
		}
	};

	const handleDelete = async (problemId) => {
		if (!window.confirm("Are you sure you want to delete this problem?"))
			return;

		try {
			await api.delete(`/problems/${problemId}`);
			fetchProblems();
			// Invalidate dashboard cache
			queryClient.invalidateQueries("dashboard");
		} catch (error) {
			console.error("Error deleting problem:", error);
			alert("Failed to delete problem");
		}
	};

	const openEditModal = (problem) => {
		setEditingProblem(problem);
		setFormData({
			title: problem.title,
			platform: problem.platform,
			problemId: problem.problemId,
			url: problem.url,
			difficulty: problem.difficulty,
			tags: problem.tags?.join(", ") || "",
			notes: problem.notes || "",
		});
		setShowAddModal(true);
	};

	const openAddModal = () => {
		setEditingProblem(null);
		setFormData({
			title: "",
			platform: "leetcode",
			problemId: "",
			url: "",
			difficulty: "easy",
			tags: "",
			notes: "",
		});
		setShowAddModal(true);
	};

	const statusOptions = [
		{ value: "all", label: "All Status" },
		{ value: "solved", label: "Solved" },
		{ value: "attempted", label: "Attempted" },
		{ value: "todo", label: "To Do" },
		{ value: "review", label: "Review" },
	];

	const difficultyOptions = [
		{ value: "all", label: "All Difficulties" },
		{ value: "easy", label: "Easy" },
		{ value: "medium", label: "Medium" },
		{ value: "hard", label: "Hard" },
	];

	const platformOptions = [
		{ value: "all", label: "All Platforms" },
		{ value: "leetcode", label: "LeetCode" },
		{ value: "codeforces", label: "Codeforces" },
		{ value: "codechef", label: "CodeChef" },
		{ value: "atcoder", label: "AtCoder" },
	];

	const getStatusColor = (status) => {
		const colors = {
			solved: "success",
			attempted: "warning",
			todo: "default",
			review: "primary",
		};
		return colors[status] || "default";
	};

	const getDifficultyColor = (difficulty) => {
		const colors = {
			easy: "success",
			medium: "warning",
			hard: "danger",
		};
		return colors[difficulty] || "default";
	};

	const getPlatformColor = (platform) => {
		const colors = {
			leetcode: "warning",
			codeforces: "primary",
			codechef: "success",
			atcoder: "danger",
		};
		return colors[platform] || "default";
	};

	const popularTags = [
		"array",
		"hash-table",
		"string",
		"dynamic-programming",
		"math",
		"sorting",
		"greedy",
		"depth-first-search",
		"binary-search",
		"breadth-first-search",
		"tree",
		"two-pointers",
		"stack",
		"graph",
		"sliding-window",
		"backtracking",
	];

	const toggleTag = (tag) => {
		if (selectedTags.includes(tag)) {
			setSelectedTags(selectedTags.filter((t) => t !== tag));
		} else {
			setSelectedTags([...selectedTags, tag]);
		}
	};

	const clearAllTags = () => {
		setSelectedTags([]);
	};

	if (loading) return <LoadingSpinner />;

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
				<div>
					<h1 className="text-2xl font-bold text-gray-900 dark:text-white">
						Problems
					</h1>
					<p className="text-gray-600 dark:text-gray-400">
						Track and manage your coding problems
					</p>
				</div>
				<Button className="mt-4 sm:mt-0" onClick={openAddModal}>
					<Plus className="w-4 h-4 mr-2" />
					Add Problem
				</Button>
			</div>

			{/* Filters */}
			<div className="card">
				<div className="card-content">
					<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
						{/* Search */}
						<div className="relative">
							<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
							<input
								type="text"
								placeholder="Search problems..."
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								className="input pl-10 w-full"
							/>
						</div>

						{/* Status Filter */}
						<select
							value={selectedStatus}
							onChange={(e) => setSelectedStatus(e.target.value)}
							className="input"
						>
							{statusOptions.map((option) => (
								<option key={option.value} value={option.value}>
									{option.label}
								</option>
							))}
						</select>

						{/* Difficulty Filter */}
						<select
							value={selectedDifficulty}
							onChange={(e) => setSelectedDifficulty(e.target.value)}
							className="input"
						>
							{difficultyOptions.map((option) => (
								<option key={option.value} value={option.value}>
									{option.label}
								</option>
							))}
						</select>

						{/* Platform Filter */}
						<select
							value={selectedPlatform}
							onChange={(e) => setSelectedPlatform(e.target.value)}
							className="input"
						>
							{platformOptions.map((option) => (
								<option key={option.value} value={option.value}>
									{option.label}
								</option>
							))}
						</select>
					</div>

					{/* Tag Filter */}
					<div className="mt-4">
						<div className="flex items-center justify-between mb-2">
							<label className="text-sm font-medium text-gray-700 dark:text-gray-300">
								Filter by Tags
							</label>
							{selectedTags.length > 0 && (
								<button
									onClick={clearAllTags}
									className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
								>
									Clear all ({selectedTags.length})
								</button>
							)}
						</div>
						<div className="flex flex-wrap gap-2">
							{popularTags.map((tag) => (
								<button
									key={tag}
									onClick={() => toggleTag(tag)}
									className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
										selectedTags.includes(tag)
											? "bg-blue-600 text-white"
											: "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
									}`}
								>
									{tag}
								</button>
							))}
						</div>
					</div>
				</div>
			</div>

			{/* Problems List */}
			<div className="card">
				<div className="card-content p-0">
					<div className="overflow-x-auto">
						<table className="w-full">
							<thead className="bg-gray-50 border-b border-gray-200">
								<tr>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
										Problem
									</th>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
										Platform
									</th>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
										Difficulty
									</th>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
										Status
									</th>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
										Tags
									</th>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
										Actions
									</th>
								</tr>
							</thead>
							<tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
								{problems.map((problem) => (
									<tr
										key={problem._id}
										className="hover:bg-gray-50 dark:hover:bg-gray-700"
									>
										<td className="px-6 py-4 whitespace-nowrap">
											<div>
												<div className="text-sm font-medium text-gray-900 dark:text-white">
													{problem.title}
												</div>
												<div className="text-sm text-gray-500 dark:text-gray-400">
													<a
														href={problem.url}
														target="_blank"
														rel="noopener noreferrer"
														className="text-primary-600 hover:text-primary-800 flex items-center gap-1"
													>
														View Problem <ExternalLink className="w-3 h-3" />
													</a>
												</div>
											</div>
										</td>
										<td className="px-6 py-4 whitespace-nowrap">
											<Badge variant={getPlatformColor(problem.platform)}>
												{problem.platform}
											</Badge>
										</td>
										<td className="px-6 py-4 whitespace-nowrap">
											<Badge variant={getDifficultyColor(problem.difficulty)}>
												{problem.difficulty}
											</Badge>
										</td>
										<td className="px-6 py-4 whitespace-nowrap">
											<select
												value={problem.status}
												onChange={(e) =>
													handleStatusChange(problem._id, e.target.value)
												}
												className="text-sm border-none bg-transparent font-medium cursor-pointer"
												style={{
													color:
														getStatusColor(problem.status) === "success"
															? "#10b981"
															: getStatusColor(problem.status) === "warning"
															? "#f59e0b"
															: "#6b7280",
												}}
											>
												<option value="todo">To Do</option>
												<option value="attempted">Attempted</option>
												<option value="solved">Solved</option>
												<option value="review">Review</option>
											</select>
										</td>
										<td className="px-6 py-4">
											<div className="flex flex-wrap gap-1">
												{problem.tags?.map((tag, index) => (
													<Badge key={index} variant="outline" size="sm">
														{tag}
													</Badge>
												))}
											</div>
										</td>
										<td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
											<div className="flex gap-2">
												<button
													onClick={() => openEditModal(problem)}
													className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
												>
													<Edit2 className="w-4 h-4" />
												</button>
												<button
													onClick={() => handleDelete(problem._id)}
													className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
												>
													<Trash2 className="w-4 h-4" />
												</button>
											</div>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				</div>
			</div>

			{/* Pagination */}
			{problems.length > 0 && totalPages > 1 && (
				<div className="card">
					<div className="card-content">
						<div className="flex items-center justify-between">
							<div className="text-sm text-gray-700 dark:text-gray-300">
								Showing {(currentPage - 1) * problemsPerPage + 1} to{" "}
								{Math.min(currentPage * problemsPerPage, totalProblems)} of{" "}
								{totalProblems} problems
							</div>
							<div className="flex gap-2">
								<Button
									variant="outline"
									size="sm"
									onClick={() =>
										setCurrentPage((prev) => Math.max(1, prev - 1))
									}
									disabled={currentPage === 1}
								>
									Previous
								</Button>
								<div className="flex items-center gap-1">
									{[...Array(totalPages)].map((_, idx) => {
										const pageNum = idx + 1;
										// Show first page, last page, current page, and pages around current
										if (
											pageNum === 1 ||
											pageNum === totalPages ||
											(pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
										) {
											return (
												<button
													key={pageNum}
													onClick={() => setCurrentPage(pageNum)}
													className={`px-3 py-1 rounded-md text-sm ${
														currentPage === pageNum
															? "bg-blue-600 text-white"
															: "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
													}`}
												>
													{pageNum}
												</button>
											);
										} else if (
											pageNum === currentPage - 2 ||
											pageNum === currentPage + 2
										) {
											return (
												<span key={pageNum} className="px-2">
													...
												</span>
											);
										}
										return null;
									})}
								</div>
								<Button
									variant="outline"
									size="sm"
									onClick={() =>
										setCurrentPage((prev) => Math.min(totalPages, prev + 1))
									}
									disabled={currentPage === totalPages}
								>
									Next
								</Button>
							</div>
						</div>
					</div>
				</div>
			)}

			{/* Empty State */}
			{problems.length === 0 && (
				<div className="text-center py-12">
					<div className="w-24 h-24 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
						<Filter className="w-12 h-12 text-gray-400" />
					</div>
					<h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
						No problems found
					</h3>
					<p className="text-gray-500 dark:text-gray-400 mb-6">
						Get started by adding your first problem or adjusting your filters.
					</p>
					<Button onClick={openAddModal}>
						<Plus className="w-4 h-4 mr-2" />
						Add Your First Problem
					</Button>
				</div>
			)}

			{/* Add/Edit Problem Modal */}
			{showAddModal && (
				<div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
					<div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white dark:bg-gray-800">
						<div className="mt-3">
							<h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
								{editingProblem ? "Edit Problem" : "Add New Problem"}
							</h3>
							<form onSubmit={handleAddProblem}>
								<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
									<div className="md:col-span-2">
										<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
											Problem Title *
										</label>
										<input
											type="text"
											value={formData.title}
											onChange={(e) =>
												setFormData({ ...formData, title: e.target.value })
											}
											className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
											required
										/>
									</div>

									<div>
										<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
											Platform *
										</label>
										<select
											value={formData.platform}
											onChange={(e) =>
												setFormData({ ...formData, platform: e.target.value })
											}
											className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
											required
										>
											<option value="leetcode">LeetCode</option>
											<option value="codeforces">Codeforces</option>
											<option value="codechef">CodeChef</option>
											<option value="atcoder">AtCoder</option>
											<option value="custom">Custom</option>
										</select>
									</div>

									<div>
										<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
											Problem ID *
										</label>
										<input
											type="text"
											value={formData.problemId}
											onChange={(e) =>
												setFormData({ ...formData, problemId: e.target.value })
											}
											className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
											placeholder="e.g., two-sum, 1A"
											required
										/>
									</div>

									<div className="md:col-span-2">
										<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
											Problem URL *
										</label>
										<input
											type="url"
											value={formData.url}
											onChange={(e) =>
												setFormData({ ...formData, url: e.target.value })
											}
											className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
											placeholder="https://..."
											required
										/>
									</div>

									<div>
										<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
											Difficulty *
										</label>
										<select
											value={formData.difficulty}
											onChange={(e) =>
												setFormData({ ...formData, difficulty: e.target.value })
											}
											className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
											required
										>
											<option value="easy">Easy</option>
											<option value="medium">Medium</option>
											<option value="hard">Hard</option>
										</select>
									</div>

									<div>
										<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
											Tags (comma separated)
										</label>
										<input
											type="text"
											value={formData.tags}
											onChange={(e) =>
												setFormData({ ...formData, tags: e.target.value })
											}
											className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
											placeholder="array, hash-table, dp"
										/>
									</div>

									<div className="md:col-span-2">
										<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
											Notes
										</label>
										<textarea
											value={formData.notes}
											onChange={(e) =>
												setFormData({ ...formData, notes: e.target.value })
											}
											className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
											rows="3"
											placeholder="Add any notes about this problem..."
										/>
									</div>
								</div>

								<div className="flex space-x-3 mt-6">
									<button
										type="button"
										onClick={() => {
											setShowAddModal(false);
											setEditingProblem(null);
										}}
										className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-medium py-2 px-4 rounded-md transition duration-200"
									>
										Cancel
									</button>
									<button
										type="submit"
										className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition duration-200"
									>
										{editingProblem ? "Update" : "Add"} Problem
									</button>
								</div>
							</form>
						</div>
					</div>
				</div>
			)}
		</div>
	);
};

export default Problems;
