import React, { useState } from "react";
import { X } from "lucide-react";
import Button from "./Button";

const AddProblemModal = ({ onClose, onAdd }) => {
	const [formData, setFormData] = useState({
		title: "",
		difficulty: "medium",
		link: "",
		platform: "",
		tags: "",
		notes: "",
	});
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");

	const platforms = [
		"leetcode",
		"codeforces",
		"codechef",
		"hackerrank",
		"geeksforgeeks",
		"other",
	];
	const difficulties = ["easy", "medium", "hard"];

	const handleSubmit = async (e) => {
		e.preventDefault();
		setError("");

		if (!formData.title.trim()) {
			setError("Problem title is required");
			return;
		}

		try {
			setLoading(true);
			const tags = formData.tags
				.split(",")
				.map((tag) => tag.trim())
				.filter((tag) => tag.length > 0);

			await onAdd({
				...formData,
				tags,
			});
		} catch (err) {
			setError(err.response?.data?.message || "Failed to add problem");
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
			<div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
				<div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
					<h2 className="text-xl font-bold text-gray-900 dark:text-white">
						Add Problem to Sheet
					</h2>
					<button
						onClick={onClose}
						className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
					>
						<X className="w-6 h-6" />
					</button>
				</div>

				<form onSubmit={handleSubmit} className="p-6 space-y-4">
					{error && (
						<div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded">
							{error}
						</div>
					)}

					<div>
						<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
							Problem Title *
						</label>
						<input
							type="text"
							value={formData.title}
							onChange={(e) =>
								setFormData({ ...formData, title: e.target.value })
							}
							className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
							placeholder="e.g., Two Sum"
							required
						/>
					</div>

					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div>
							<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
								Difficulty *
							</label>
							<select
								value={formData.difficulty}
								onChange={(e) =>
									setFormData({ ...formData, difficulty: e.target.value })
								}
								className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
								required
							>
								{difficulties.map((diff) => (
									<option key={diff} value={diff} className="capitalize">
										{diff}
									</option>
								))}
							</select>
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
								Platform
							</label>
							<select
								value={formData.platform}
								onChange={(e) =>
									setFormData({ ...formData, platform: e.target.value })
								}
								className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
							>
								<option value="">Select platform</option>
								{platforms.map((platform) => (
									<option
										key={platform}
										value={platform}
										className="capitalize"
									>
										{platform}
									</option>
								))}
							</select>
						</div>
					</div>

					<div>
						<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
							Problem Link
						</label>
						<input
							type="url"
							value={formData.link}
							onChange={(e) =>
								setFormData({ ...formData, link: e.target.value })
							}
							className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
							placeholder="https://leetcode.com/problems/..."
						/>
					</div>

					<div>
						<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
							Tags (comma-separated)
						</label>
						<input
							type="text"
							value={formData.tags}
							onChange={(e) =>
								setFormData({ ...formData, tags: e.target.value })
							}
							className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
							placeholder="e.g., array, hash-table, two-pointers"
						/>
					</div>

					<div>
						<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
							Notes
						</label>
						<textarea
							value={formData.notes}
							onChange={(e) =>
								setFormData({ ...formData, notes: e.target.value })
							}
							className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
							placeholder="Add any notes or hints..."
							rows={3}
						/>
					</div>

					<div className="flex space-x-3 pt-4">
						<Button
							type="button"
							variant="outline"
							onClick={onClose}
							className="flex-1"
							disabled={loading}
						>
							Cancel
						</Button>
						<Button type="submit" className="flex-1" disabled={loading}>
							{loading ? "Adding..." : "Add Problem"}
						</Button>
					</div>
				</form>
			</div>
		</div>
	);
};

export default AddProblemModal;
