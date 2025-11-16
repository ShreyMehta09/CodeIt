import React, { useState } from "react";
import { X } from "lucide-react";
import Button from "./Button";

const CreateSheetModal = ({ onClose, onCreate }) => {
	const [formData, setFormData] = useState({
		name: "",
		description: "",
		category: "custom",
		isPublic: false,
		tags: "",
	});
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");

	const categories = [
		{ value: "custom", label: "Custom" },
		{ value: "dsa", label: "DSA" },
		{ value: "algorithms", label: "Algorithms" },
		{ value: "data-structures", label: "Data Structures" },
		{ value: "dynamic-programming", label: "Dynamic Programming" },
		{ value: "graphs", label: "Graphs" },
		{ value: "trees", label: "Trees" },
		{ value: "arrays", label: "Arrays" },
		{ value: "strings", label: "Strings" },
		{ value: "math", label: "Math" },
		{ value: "greedy", label: "Greedy" },
		{ value: "backtracking", label: "Backtracking" },
		{ value: "contest", label: "Contest" },
		{ value: "interview", label: "Interview" },
	];

	const handleSubmit = async (e) => {
		e.preventDefault();
		setError("");

		if (!formData.name.trim()) {
			setError("Sheet name is required");
			return;
		}

		try {
			setLoading(true);
			const tags = formData.tags
				.split(",")
				.map((tag) => tag.trim())
				.filter((tag) => tag.length > 0);

			await onCreate({
				...formData,
				tags,
			});
		} catch (err) {
			setError(err.response?.data?.message || "Failed to create sheet");
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
			<div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
				<div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
					<h2 className="text-xl font-bold text-gray-900 dark:text-white">
						Create New Sheet
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
							Sheet Name *
						</label>
						<input
							type="text"
							value={formData.name}
							onChange={(e) =>
								setFormData({ ...formData, name: e.target.value })
							}
							className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
							placeholder="e.g., My Practice Sheet"
							maxLength={100}
							required
						/>
					</div>

					<div>
						<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
							Description
						</label>
						<textarea
							value={formData.description}
							onChange={(e) =>
								setFormData({ ...formData, description: e.target.value })
							}
							className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
							placeholder="Describe your sheet..."
							rows={3}
							maxLength={500}
						/>
					</div>

					<div>
						<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
							Category
						</label>
						<select
							value={formData.category}
							onChange={(e) =>
								setFormData({ ...formData, category: e.target.value })
							}
							className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
						>
							{categories.map((cat) => (
								<option key={cat.value} value={cat.value}>
									{cat.label}
								</option>
							))}
						</select>
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
							placeholder="e.g., graphs, dp, arrays"
						/>
					</div>

					<div className="flex items-center">
						<input
							type="checkbox"
							id="isPublic"
							checked={formData.isPublic}
							onChange={(e) =>
								setFormData({ ...formData, isPublic: e.target.checked })
							}
							className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
						/>
						<label
							htmlFor="isPublic"
							className="ml-2 block text-sm text-gray-700 dark:text-gray-300"
						>
							Make this sheet public
						</label>
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
							{loading ? "Creating..." : "Create Sheet"}
						</Button>
					</div>
				</form>
			</div>
		</div>
	);
};

export default CreateSheetModal;
