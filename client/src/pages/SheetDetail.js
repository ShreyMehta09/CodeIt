import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQueryClient } from "react-query";
import {
	ArrowLeft,
	Share,
	Edit,
	Plus,
	ExternalLink,
	CheckCircle,
	Clock,
	AlertCircle,
} from "lucide-react";
import Button from "../components/UI/Button";
import Badge from "../components/UI/Badge";
import LoadingSpinner from "../components/UI/LoadingSpinner";
import AddProblemModal from "../components/UI/AddProblemModal";
import api from "../utils/api";
import { useAuth } from "../contexts/AuthContext";

const SheetDetail = () => {
	const { id } = useParams();
	const navigate = useNavigate();
	const { user } = useAuth();
	const queryClient = useQueryClient();
	const [sheet, setSheet] = useState(null);
	const [problems, setProblems] = useState([]);
	const [loading, setLoading] = useState(true);
	const [showAddProblemModal, setShowAddProblemModal] = useState(false);
	const [isOwner, setIsOwner] = useState(false);

	useEffect(() => {
		fetchSheetDetails();
	}, [id]);

	const fetchSheetDetails = async () => {
		try {
			const response = await api.get(`/sheets/${id}`);
			setSheet(response.data.sheet);
			setProblems(response.data.problems || []);
			setIsOwner(response.data.isOwner || false);
		} catch (error) {
			console.error("Error fetching sheet:", error);
			if (error.response?.status === 404) {
				alert("Sheet not found");
				navigate("/sheets");
			}
		} finally {
			setLoading(false);
		}
	};

	const handleAddProblem = async (problemData) => {
		try {
			await api.post(`/sheets/${id}/add-problem`, problemData);
			setShowAddProblemModal(false);
			await fetchSheetDetails();
		} catch (error) {
			console.error("Error adding problem:", error);
			throw error;
		}
	};

	const handleStatusChange = async (problemId, newStatus) => {
		try {
			await api.patch(`/sheets/${id}/problems/${problemId}/status`, {
				status: newStatus,
			});
			await fetchSheetDetails();
			// Invalidate dashboard cache to reflect updated stats
			queryClient.invalidateQueries("dashboard");
		} catch (error) {
			console.error("Error updating problem status:", error);
			alert("Failed to update problem status");
		}
	};

	const handleRequestApproval = async () => {
		if (
			!window.confirm(
				"Request admin approval to make this sheet global? This will make it public."
			)
		) {
			return;
		}

		try {
			const response = await api.post(`/sheets/${id}/request-approval`);
			alert(
				response.data.message || "Approval request submitted successfully!"
			);
			await fetchSheetDetails();
		} catch (error) {
			console.error("Error requesting approval:", error);
			alert(error.response?.data?.message || "Failed to request approval");
		}
	};

	if (loading) return <LoadingSpinner />;

	if (loading) return <LoadingSpinner />;

	if (!sheet) {
		return (
			<div className="text-center py-12">
				<p className="text-gray-600">Sheet not found</p>
				<Button className="mt-4" onClick={() => navigate("/sheets")}>
					Back to Sheets
				</Button>
			</div>
		);
	}

	const calculateProgress = (solved, total) => {
		if (total === 0) return 0;
		return Math.round((solved / total) * 100);
	};

	const getStatusIcon = (status) => {
		switch (status) {
			case "solved":
				return <CheckCircle className="w-4 h-4 text-green-600" />;
			case "attempted":
				return <Clock className="w-4 h-4 text-yellow-600" />;
			default:
				return <AlertCircle className="w-4 h-4 text-gray-400" />;
		}
	};

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

	const getApprovalStatusBadge = () => {
		if (!sheet.approvalStatus || sheet.approvalStatus === "not_requested")
			return null;

		const statusConfig = {
			pending: { color: "warning", text: "Approval Pending" },
			approved: { color: "success", text: "Approved & Global" },
			rejected: { color: "danger", text: "Approval Rejected" },
		};

		const config = statusConfig[sheet.approvalStatus];
		if (!config) return null;

		return (
			<Badge variant={config.color} className="ml-2">
				{config.text}
			</Badge>
		);
	};

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-center space-x-4">
				<Button variant="ghost" size="sm" onClick={() => navigate("/sheets")}>
					<ArrowLeft className="w-4 h-4 mr-2" />
					Back to Sheets
				</Button>
			</div>

			{/* Sheet Info */}
			<div className="card">
				<div className="card-header">
					<div className="flex flex-col sm:flex-row sm:items-start sm:justify-between">
						<div className="flex-1">
							<div className="flex items-center">
								<h1 className="text-2xl font-bold text-gray-900 dark:text-white">
									{sheet.name}
								</h1>
								{getApprovalStatusBadge()}
							</div>
							<p className="text-gray-600 dark:text-gray-400 mb-4 mt-2">
								{sheet.description}
							</p>

							<div className="flex items-center space-x-4 mb-4 flex-wrap gap-2">
								<Badge variant="outline" className="capitalize">
									{sheet.category}
								</Badge>
								<span className="text-sm text-gray-500 dark:text-gray-400">
									{sheet.totalProblems || problems.length} problems
								</span>
								<span className="text-sm text-gray-500 dark:text-gray-400">
									{sheet.isGlobal
										? "Global"
										: sheet.isPublic
										? "Public"
										: "Private"}
								</span>
							</div>

							{sheet.rejectionReason && (
								<div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded mb-4">
									<p className="font-medium">Rejection Reason:</p>
									<p className="text-sm">{sheet.rejectionReason}</p>
								</div>
							)}

							{/* Progress */}
							<div className="max-w-md">
								<div className="flex justify-between text-sm mb-2">
									<span className="text-gray-600 dark:text-gray-400">
										Progress
									</span>
									<span className="font-medium text-gray-900 dark:text-white">
										{sheet.solvedProblems || 0}/
										{sheet.totalProblems || problems.length}
									</span>
								</div>
								<div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
									<div
										className="bg-primary-600 h-3 rounded-full transition-all duration-300"
										style={{
											width: `${calculateProgress(
												sheet.solvedProblems || 0,
												sheet.totalProblems || problems.length
											)}%`,
										}}
									/>
								</div>
								<div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
									{calculateProgress(
										sheet.solvedProblems || 0,
										sheet.totalProblems || problems.length
									)}
									% complete
								</div>
							</div>
						</div>

						<div className="flex flex-wrap gap-2 mt-4 sm:mt-0">
							{isOwner && (
								<>
									<Button
										size="sm"
										onClick={() => setShowAddProblemModal(true)}
									>
										<Plus className="w-4 h-4 mr-2" />
										Add Problem
									</Button>
									{!sheet.isGlobal &&
										sheet.approvalStatus !== "pending" &&
										sheet.approvalStatus !== "approved" && (
											<Button
												variant="outline"
												size="sm"
												onClick={handleRequestApproval}
											>
												Request Global Approval
											</Button>
										)}
								</>
							)}
						</div>
					</div>
				</div>
			</div>

			{/* Problems List */}
			<div className="card">
				<div className="card-header">
					<h2 className="card-title">Problems</h2>
					<p className="card-description">
						{problems.length} problems in this sheet
					</p>
				</div>
				<div className="card-content p-0">
					{problems.length === 0 ? (
						<div className="text-center py-12 px-4">
							<p className="text-gray-500 dark:text-gray-400 mb-4">
								No problems added yet
							</p>
							{isOwner && (
								<Button onClick={() => setShowAddProblemModal(true)}>
									<Plus className="w-4 h-4 mr-2" />
									Add Your First Problem
								</Button>
							)}
						</div>
					) : (
						<div className="overflow-x-auto">
							<table className="w-full">
								<thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
									<tr>
										<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
											#
										</th>
										<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
											Problem
										</th>
										<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
											Difficulty
										</th>
										{isOwner && (
											<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
												Status
											</th>
										)}
										<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
											Tags
										</th>
										<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
											Link
										</th>
									</tr>
								</thead>
								<tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
									{problems.map((problem, index) => (
										<tr
											key={problem._id}
											className="hover:bg-gray-50 dark:hover:bg-gray-700"
										>
											<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
												{index + 1}
											</td>
											<td className="px-6 py-4">
												<div>
													<div className="text-sm font-medium text-gray-900 dark:text-white">
														{problem.title}
													</div>
													{problem.platform && (
														<div className="text-sm text-gray-500 dark:text-gray-400 capitalize">
															{problem.platform}
														</div>
													)}
												</div>
											</td>
											<td className="px-6 py-4 whitespace-nowrap">
												<Badge
													variant={getDifficultyColor(problem.difficulty)}
													className="capitalize"
												>
													{problem.difficulty}
												</Badge>
											</td>
											{isOwner && (
												<td className="px-6 py-4 whitespace-nowrap">
													<select
														value={problem.status || "todo"}
														onChange={(e) =>
															handleStatusChange(problem._id, e.target.value)
														}
														className="text-sm border border-gray-300 dark:border-gray-600 rounded-md px-2 py-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
													>
														<option value="todo">Todo</option>
														<option value="attempted">Attempted</option>
														<option value="solved">Solved</option>
														<option value="review">Review</option>
													</select>
												</td>
											)}
											<td className="px-6 py-4">
												<div className="flex flex-wrap gap-1">
													{problem.tags && problem.tags.length > 0 ? (
														problem.tags.slice(0, 3).map((tag, tagIndex) => (
															<Badge key={tagIndex} variant="outline" size="sm">
																{tag}
															</Badge>
														))
													) : (
														<span className="text-sm text-gray-400">-</span>
													)}
												</div>
											</td>
											<td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
												{problem.link ? (
													<a
														href={problem.link}
														target="_blank"
														rel="noopener noreferrer"
														className="text-primary-600 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-300 inline-flex items-center"
													>
														<ExternalLink className="w-4 h-4 mr-1" />
														Open
													</a>
												) : (
													<span className="text-gray-400">-</span>
												)}
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					)}
				</div>
			</div>

			{/* Add Problem Modal */}
			{showAddProblemModal && (
				<AddProblemModal
					onClose={() => setShowAddProblemModal(false)}
					onAdd={handleAddProblem}
				/>
			)}
		</div>
	);
};

export default SheetDetail;
