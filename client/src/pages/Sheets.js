import React, { useState, useEffect } from "react";
import { useQueryClient } from "react-query";
import {
	Plus,
	FileText,
	Users,
	Lock,
	Globe,
	Search,
	Download,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import Button from "../components/UI/Button";
import Badge from "../components/UI/Badge";
import LoadingSpinner from "../components/UI/LoadingSpinner";
import CreateSheetModal from "../components/UI/CreateSheetModal";
import api from "../utils/api";

const Sheets = () => {
	const { user } = useAuth();
	const queryClient = useQueryClient();
	const [loading, setLoading] = useState(true);
	const [sheets, setSheets] = useState([]);
	const [globalSheets, setGlobalSheets] = useState([]);
	const [filter, setFilter] = useState("all"); // 'all', 'my', 'global'
	const [searchQuery, setSearchQuery] = useState("");
	const [showCreateModal, setShowCreateModal] = useState(false);
	const [addingSheet, setAddingSheet] = useState(null);

	useEffect(() => {
		fetchSheets();
		fetchGlobalSheets();
	}, []);

	const fetchSheets = async () => {
		try {
			const response = await api.get("/sheets");
			setSheets(response.data.sheets || []);
		} catch (error) {
			console.error("Error fetching sheets:", error);
			setSheets([]);
		} finally {
			setLoading(false);
		}
	};

	const fetchGlobalSheets = async () => {
		try {
			const response = await api.get("/sheets/global");
			setGlobalSheets(response.data.sheets || []);
		} catch (error) {
			console.error("Error fetching global sheets:", error);
			setGlobalSheets([]);
		}
	};

	const handleAddToMySheets = async (sheetId) => {
		try {
			setAddingSheet(sheetId);
			const response = await api.post(`/sheets/${sheetId}/add-to-my-sheets`);

			// Refresh user's sheets
			await fetchSheets();

			// Invalidate dashboard cache
			queryClient.invalidateQueries("dashboard");

			alert(response.data.message || "Sheet added to your collection!");
		} catch (error) {
			console.error("Error adding sheet:", error);
			alert(
				error.response?.data?.message ||
					"Failed to add sheet to your collection"
			);
		} finally {
			setAddingSheet(null);
		}
	};

	const handleCreateSheet = async (sheetData) => {
		try {
			await api.post("/sheets", sheetData);
			setShowCreateModal(false);
			await fetchSheets();
			// Invalidate dashboard cache
			queryClient.invalidateQueries("dashboard");
		} catch (error) {
			console.error("Error creating sheet:", error);
			throw error;
		}
	};

	const handleDeleteSheet = async (sheetId) => {
		if (!window.confirm("Are you sure you want to delete this sheet?")) {
			return;
		}

		try {
			await api.delete(`/sheets/${sheetId}`);
			await fetchSheets();
			// Invalidate dashboard cache
			queryClient.invalidateQueries("dashboard");
		} catch (error) {
			console.error("Error deleting sheet:", error);
			alert("Failed to delete sheet");
		}
	};

	const allSheets =
		filter === "my"
			? sheets
			: filter === "global"
			? globalSheets
			: (() => {
					// Filter out global sheets that user has added to their collection
					const userSheetTemplates = sheets
						.filter((s) => s.templateSource)
						.map((s) => s.templateSource);

					const filteredGlobalSheets = globalSheets.filter(
						(gs) => !userSheetTemplates.includes(gs.templateSource)
					);

					return [...sheets, ...filteredGlobalSheets];
			  })();

	const filteredSheets = allSheets.filter((sheet) => {
		if (!searchQuery) return true;
		const query = searchQuery.toLowerCase();
		return (
			sheet.name?.toLowerCase().includes(query) ||
			sheet.description?.toLowerCase().includes(query) ||
			sheet.category?.toLowerCase().includes(query)
		);
	});

	const calculateProgress = (solved, total) => {
		if (total === 0) return 0;
		return Math.round((solved / total) * 100);
	};

	const isUserSheet = (sheet) => {
		return (
			sheet.userId === user?.id || (!sheet.isGlobal && !sheet.createdByAdmin)
		);
	};

	if (loading) return <LoadingSpinner />;

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
				<div>
					<h1 className="text-2xl font-bold text-gray-900 dark:text-white">
						Problem Sheets
					</h1>
					<p className="text-gray-600 dark:text-gray-400">
						Organize your practice with custom problem collections
					</p>
				</div>
				<Button
					className="mt-4 sm:mt-0"
					onClick={() => setShowCreateModal(true)}
				>
					<Plus className="w-4 h-4 mr-2" />
					Create Sheet
				</Button>
			</div>

			{/* Search Bar */}
			<div className="relative">
				<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
				<input
					type="text"
					placeholder="Search sheets by name, description, or category..."
					value={searchQuery}
					onChange={(e) => setSearchQuery(e.target.value)}
					className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-800 dark:text-white"
				/>
			</div>

			{/* Filter Tabs */}
			<div className="border-b border-gray-200 dark:border-gray-700">
				<nav className="-mb-px flex space-x-8">
					<button
						onClick={() => setFilter("all")}
						className={`py-2 px-1 border-b-2 font-medium text-sm ${
							filter === "all"
								? "border-blue-500 text-blue-600 dark:text-blue-400"
								: "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300"
						}`}
					>
						All Sheets
					</button>
					<button
						onClick={() => setFilter("my")}
						className={`py-2 px-1 border-b-2 font-medium text-sm ${
							filter === "my"
								? "border-blue-500 text-blue-600 dark:text-blue-400"
								: "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300"
						}`}
					>
						My Sheets
					</button>
					<button
						onClick={() => setFilter("global")}
						className={`py-2 px-1 border-b-2 font-medium text-sm ${
							filter === "global"
								? "border-blue-500 text-blue-600 dark:text-blue-400"
								: "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300"
						}`}
					>
						Global Sheets
					</button>
				</nav>
			</div>

			{/* Sheets Grid */}
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
				{filteredSheets.map((sheet) => {
					const isOwner = isUserSheet(sheet);
					const isGlobal = sheet.isGlobal || sheet.createdByAdmin;

					return (
						<div
							key={sheet._id}
							className="bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-md transition-shadow border border-gray-200 dark:border-gray-700"
						>
							<div className="p-6">
								<div className="flex items-start justify-between mb-4">
									<div className="flex-1">
										<div className="flex items-center space-x-2 mb-2">
											<h3 className="text-lg font-semibold text-gray-900 dark:text-white">
												{sheet.name}
											</h3>
											{isGlobal && (
												<span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
													<Globe className="w-3 h-3 mr-1" />
													Global
												</span>
											)}
										</div>
										<p className="text-gray-600 dark:text-gray-400 text-sm">
											{sheet.description}
										</p>
									</div>
									<div className="flex items-center space-x-2">
										{sheet.isPublic ? (
											<Users className="w-4 h-4 text-green-600" />
										) : (
											<Lock className="w-4 h-4 text-gray-400" />
										)}
									</div>
								</div>

								<div className="space-y-4">
									{/* Progress */}
									<div>
										<div className="flex justify-between text-sm mb-2">
											<span className="text-gray-600 dark:text-gray-400">
												Progress
											</span>
											<span className="font-medium text-gray-900 dark:text-white">
												{sheet.solvedProblems || 0}/
												{sheet.totalProblems || sheet.problems?.length || 0}
											</span>
										</div>
										<div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
											<div
												className="bg-blue-600 h-2 rounded-full transition-all duration-300"
												style={{
													width: `${calculateProgress(
														sheet.solvedProblems || 0,
														sheet.totalProblems || sheet.problems?.length || 0
													)}%`,
												}}
											/>
										</div>
									</div>

									{/* Category and Stats */}
									<div className="flex items-center justify-between">
										<Badge variant="secondary" className="capitalize">
											{sheet.category}
										</Badge>
										<div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
											<FileText className="w-3 h-3 mr-1" />
											{sheet.totalProblems || sheet.problems?.length || 0}{" "}
											problems
										</div>
									</div>

									{/* Updated date */}
									<div className="text-xs text-gray-500 dark:text-gray-400">
										Updated {new Date(sheet.updatedAt).toLocaleDateString()}
									</div>
								</div>

								{/* Action buttons */}
								<div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
									<Button
										variant="outline"
										size="sm"
										className="w-full"
										onClick={() =>
											(window.location.href = `/sheets/${sheet._id}`)
										}
									>
										View Sheet
									</Button>

									{isGlobal && !isOwner && (
										<Button
											size="sm"
											className="w-full"
											onClick={() => handleAddToMySheets(sheet._id)}
											disabled={addingSheet === sheet._id}
										>
											<Download className="w-4 h-4 mr-2" />
											{addingSheet === sheet._id
												? "Adding..."
												: "Add to My Sheets"}
										</Button>
									)}

									{isOwner && !isGlobal && (
										<Button
											variant="outline"
											size="sm"
											className="w-full text-red-600 hover:text-red-700"
											onClick={() => handleDeleteSheet(sheet._id)}
										>
											Delete Sheet
										</Button>
									)}
								</div>
							</div>
						</div>
					);
				})}
			</div>

			{/* Empty state */}
			{filteredSheets.length === 0 && (
				<div className="text-center py-12">
					<FileText className="mx-auto h-12 w-12 text-gray-400" />
					<h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
						{searchQuery
							? "No sheets found"
							: filter === "my"
							? "No personal sheets"
							: filter === "global"
							? "No global sheets"
							: "No sheets found"}
					</h3>
					<p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
						{searchQuery
							? "Try adjusting your search query."
							: filter === "my"
							? "Get started by creating your first sheet."
							: "Check back later for new content."}
					</p>
					{filter === "my" && !searchQuery && (
						<div className="mt-6">
							<Button onClick={() => setShowCreateModal(true)}>
								<Plus className="w-4 h-4 mr-2" />
								Create Your First Sheet
							</Button>
						</div>
					)}
				</div>
			)}

			{/* Create Sheet Modal */}
			{showCreateModal && (
				<CreateSheetModal
					onClose={() => setShowCreateModal(false)}
					onCreate={handleCreateSheet}
				/>
			)}
		</div>
	);
};

export default Sheets;
