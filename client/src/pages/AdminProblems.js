import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import LoadingSpinner from "../components/UI/LoadingSpinner";
import api from "../utils/api";

const AdminProblems = () => {
	const { user } = useAuth();
	const navigate = useNavigate();
	const [loading, setLoading] = useState(true);
	const [problems, setProblems] = useState([]);
	const [showCreateModal, setShowCreateModal] = useState(false);
	const [showBulkImportModal, setShowBulkImportModal] = useState(false);
	const [importing, setImporting] = useState(false);
	const [formData, setFormData] = useState({
		title: "",
		platform: "leetcode",
		problemId: "",
		url: "",
		difficulty: "medium",
		tags: "",
	});

	useEffect(() => {
		if (!user || user.username !== "admin") {
			navigate("/dashboard");
			return;
		}
		fetchGlobalProblems();
	}, [user, navigate]);

	const fetchGlobalProblems = async () => {
		try {
			const response = await api.get("/admin/problems");
			setProblems(response.data);
		} catch (error) {
			console.error("Error fetching problems:", error);
		} finally {
			setLoading(false);
		}
	};

	const handleCreateProblem = async (e) => {
		e.preventDefault();
		try {
			const problemData = {
				...formData,
				tags: formData.tags
					.split(",")
					.map((tag) => tag.trim())
					.filter((tag) => tag),
			};
			await api.post("/admin/problems", problemData);
			setShowCreateModal(false);
			setFormData({
				title: "",
				platform: "leetcode",
				problemId: "",
				url: "",
				difficulty: "medium",
				tags: "",
			});
			fetchGlobalProblems();
		} catch (error) {
			console.error("Error creating problem:", error);
		}
	};

	const handleDeleteProblem = async (problemId) => {
		if (window.confirm("Are you sure you want to delete this problem?")) {
			try {
				await api.delete(`/admin/problems/${problemId}`);
				fetchGlobalProblems();
			} catch (error) {
				console.error("Error deleting problem:", error);
			}
		}
	};

	const handleBulkImport = async (e) => {
		e.preventDefault();
		const file = e.target.file.files[0];
		if (!file) {
			alert("Please select a file");
			return;
		}

		const formData = new FormData();
		formData.append("file", file);

		setImporting(true);
		try {
			const response = await api.post("/admin/problems/bulk-import", formData, {
				headers: {
					"Content-Type": "multipart/form-data",
				},
			});
			alert(`Successfully imported ${response.data.imported} problems!`);
			if (response.data.errors) {
				console.warn("Import errors:", response.data.errors);
			}
			setShowBulkImportModal(false);
			fetchGlobalProblems();
		} catch (error) {
			console.error("Error importing problems:", error);
			alert("Failed to import problems. Check console for details.");
		} finally {
			setImporting(false);
		}
	};

	const getDifficultyColor = (difficulty) => {
		switch (difficulty) {
			case "easy":
				return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
			case "medium":
				return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
			case "hard":
				return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
			default:
				return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
		}
	};

	const getPlatformColor = (platform) => {
		switch (platform) {
			case "leetcode":
				return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200";
			case "codeforces":
				return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
			case "codechef":
				return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
			case "atcoder":
				return "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200";
			default:
				return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
		}
	};

	if (loading) return <LoadingSpinner />;

	return (
		<div className="min-h-screen bg-gray-50 dark:bg-gray-900">
			<div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
				{/* Header */}
				<div className="px-4 py-6 sm:px-0">
					<div className="flex justify-between items-center border-b border-gray-200 dark:border-gray-700 pb-4">
						<div>
							<h1 className="text-3xl font-bold text-gray-900 dark:text-white">
								Manage Global Problems
							</h1>
							<p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
								Add and manage problems visible to all users
							</p>
						</div>
						<div className="flex gap-2">
							<button
								onClick={() => setShowBulkImportModal(true)}
								className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-md transition duration-200"
							>
								Bulk Import
							</button>
							<button
								onClick={() => setShowCreateModal(true)}
								className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition duration-200"
							>
								Add New Problem
							</button>
						</div>
					</div>
				</div>

				{/* Problems List */}
				<div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-md">
					<ul className="divide-y divide-gray-200 dark:divide-gray-700">
						{problems.map((problem) => (
							<li key={problem._id}>
								<div className="px-4 py-4 sm:px-6">
									<div className="flex items-center justify-between">
										<div className="flex-1 min-w-0">
											<div className="flex items-center space-x-3">
												<p className="text-sm font-medium text-gray-900 dark:text-white truncate">
													{problem.title}
												</p>
												<span
													className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPlatformColor(
														problem.platform
													)}`}
												>
													{problem.platform}
												</span>
												<span
													className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getDifficultyColor(
														problem.difficulty
													)}`}
												>
													{problem.difficulty}
												</span>
											</div>
											<div className="mt-2 flex items-center text-sm text-gray-500 dark:text-gray-400">
												<span className="truncate">
													ID: {problem.problemId}
												</span>
												<span className="mx-2">•</span>
												<a
													href={problem.url}
													target="_blank"
													rel="noopener noreferrer"
													className="text-blue-600 dark:text-blue-400 hover:underline"
												>
													View Problem
												</a>
											</div>
											{problem.tags && problem.tags.length > 0 && (
												<div className="mt-2 flex flex-wrap gap-1">
													{problem.tags.map((tag, index) => (
														<span
															key={index}
															className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
														>
															{tag}
														</span>
													))}
												</div>
											)}
										</div>
										<div className="flex items-center space-x-2">
											<button
												onClick={() => handleDeleteProblem(problem._id)}
												className="bg-red-600 hover:bg-red-700 text-white text-sm font-medium py-1 px-3 rounded-md transition duration-200"
											>
												Delete
											</button>
										</div>
									</div>
								</div>
							</li>
						))}
					</ul>
				</div>

				{problems.length === 0 && (
					<div className="text-center py-12">
						<svg
							className="mx-auto h-12 w-12 text-gray-400"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
							/>
						</svg>
						<h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
							No global problems
						</h3>
						<p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
							Get started by adding a new global problem.
						</p>
					</div>
				)}

				{/* Create Problem Modal */}
				{showCreateModal && (
					<div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
						<div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white dark:bg-gray-800">
							<div className="mt-3">
								<h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
									Add New Global Problem
								</h3>
								<form onSubmit={handleCreateProblem}>
									<div className="mb-4">
										<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
											Problem Title
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

									<div className="mb-4">
										<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
											Platform
										</label>
										<select
											value={formData.platform}
											onChange={(e) =>
												setFormData({ ...formData, platform: e.target.value })
											}
											className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
										>
											<option value="leetcode">LeetCode</option>
											<option value="codeforces">Codeforces</option>
											<option value="codechef">CodeChef</option>
											<option value="atcoder">AtCoder</option>
											<option value="custom">Custom</option>
										</select>
									</div>

									<div className="mb-4">
										<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
											Problem ID
										</label>
										<input
											type="text"
											value={formData.problemId}
											onChange={(e) =>
												setFormData({ ...formData, problemId: e.target.value })
											}
											className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
											placeholder="e.g., two-sum, 1000A"
											required
										/>
									</div>

									<div className="mb-4">
										<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
											Problem URL
										</label>
										<input
											type="url"
											value={formData.url}
											onChange={(e) =>
												setFormData({ ...formData, url: e.target.value })
											}
											className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
											required
										/>
									</div>

									<div className="mb-4">
										<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
											Difficulty
										</label>
										<select
											value={formData.difficulty}
											onChange={(e) =>
												setFormData({ ...formData, difficulty: e.target.value })
											}
											className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
										>
											<option value="easy">Easy</option>
											<option value="medium">Medium</option>
											<option value="hard">Hard</option>
											<option value="div1">Div 1</option>
											<option value="div2">Div 2</option>
											<option value="div3">Div 3</option>
											<option value="beginner">Beginner</option>
											<option value="regular">Regular</option>
											<option value="expert">Expert</option>
										</select>
									</div>

									<div className="mb-6">
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
											placeholder="e.g., array, hash-table, two-pointers"
										/>
									</div>

									<div className="flex space-x-3">
										<button
											type="button"
											onClick={() => setShowCreateModal(false)}
											className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-medium py-2 px-4 rounded-md transition duration-200"
										>
											Cancel
										</button>
										<button
											type="submit"
											className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition duration-200"
										>
											Add Problem
										</button>
									</div>
								</form>
							</div>
						</div>
					</div>
				)}

				{/* Bulk Import Modal */}
				{showBulkImportModal && (
					<div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
						<div className="relative top-20 mx-auto p-5 border w-[600px] shadow-lg rounded-md bg-white dark:bg-gray-800">
							<div className="mt-3">
								<h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
									Bulk Import Problems
								</h3>
								<div className="mb-4">
									<p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
										Upload a CSV or Excel file with the following columns:
									</p>
									<div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-md mb-4">
										<code className="text-xs text-gray-800 dark:text-gray-200">
											title, platform, problemId, url, difficulty, tags
										</code>
									</div>
									<div className="text-xs text-gray-500 dark:text-gray-400 space-y-1 mb-4">
										<p>
											• <strong>title:</strong> Name of the problem (required)
										</p>
										<p>
											• <strong>platform:</strong> leetcode, codeforces,
											codechef, atcoder (required)
										</p>
										<p>
											• <strong>problemId:</strong> Problem ID or slug
											(required)
										</p>
										<p>
											• <strong>url:</strong> Full URL to the problem (required)
										</p>
										<p>
											• <strong>difficulty:</strong> easy, medium, hard
											(required)
										</p>
										<p>
											• <strong>tags:</strong> Comma-separated tags (optional)
										</p>
									</div>
									<div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md p-3 mb-4">
										<p className="text-sm text-blue-800 dark:text-blue-200">
											<strong>Example CSV:</strong>
										</p>
										<pre className="text-xs mt-2 text-blue-700 dark:text-blue-300 overflow-x-auto">
											title,platform,problemId,url,difficulty,tags Two
											Sum,leetcode,two-sum,https://leetcode.com/problems/two-sum/,easy,"array,hash-table"
											Add Two
											Numbers,leetcode,add-two-numbers,https://leetcode.com/problems/add-two-numbers/,medium,"linked-list,math"
										</pre>
									</div>
								</div>
								<form onSubmit={handleBulkImport}>
									<div className="mb-4">
										<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
											Choose File (CSV or Excel)
										</label>
										<input
											type="file"
											name="file"
											accept=".csv,.xlsx,.xls"
											className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white"
											required
										/>
									</div>

									<div className="flex space-x-3">
										<button
											type="button"
											onClick={() => setShowBulkImportModal(false)}
											disabled={importing}
											className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-medium py-2 px-4 rounded-md transition duration-200 disabled:opacity-50"
										>
											Cancel
										</button>
										<button
											type="submit"
											disabled={importing}
											className="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-md transition duration-200 disabled:opacity-50 flex items-center justify-center"
										>
											{importing ? (
												<>
													<svg
														className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
														xmlns="http://www.w3.org/2000/svg"
														fill="none"
														viewBox="0 0 24 24"
													>
														<circle
															className="opacity-25"
															cx="12"
															cy="12"
															r="10"
															stroke="currentColor"
															strokeWidth="4"
														></circle>
														<path
															className="opacity-75"
															fill="currentColor"
															d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
														></path>
													</svg>
													Importing...
												</>
											) : (
												"Import Problems"
											)}
										</button>
									</div>
								</form>
							</div>
						</div>
					</div>
				)}
			</div>
		</div>
	);
};

export default AdminProblems;
