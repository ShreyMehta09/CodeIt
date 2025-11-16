import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import {
	Users,
	FileText,
	Code,
	Shield,
	Plus,
	Settings,
	Clock,
	CheckCircle,
	XCircle,
} from "lucide-react";
import LoadingSpinner from "../components/UI/LoadingSpinner";
import api from "../utils/api";

const AdminDashboard = () => {
	const { user } = useAuth();
	const [loading, setLoading] = useState(true);
	const [stats, setStats] = useState({
		totalUsers: 0,
		globalSheets: 0,
		globalProblems: 0,
		pendingApprovals: 0,
	});
	const [pendingSheets, setPendingSheets] = useState([]);
	const [loadingPending, setLoadingPending] = useState(true);

	useEffect(() => {
		console.log("AdminDashboard - Fetching stats for admin user");
		fetchAdminStats();
		fetchPendingApprovals();
	}, []);

	const fetchAdminStats = async () => {
		try {
			console.log("Fetching admin stats...");
			const response = await api.get("/admin/stats");
			console.log("Admin stats response:", response.data);
			setStats(response.data);
		} catch (error) {
			console.error("Error fetching admin stats:", error);
		} finally {
			setLoading(false);
		}
	};

	const fetchPendingApprovals = async () => {
		try {
			console.log("Fetching pending approvals...");
			const response = await api.get("/admin/sheets/pending-approvals");
			console.log("Pending approvals response:", response.data);
			setPendingSheets(response.data.sheets || []);
		} catch (error) {
			console.error("Error fetching pending approvals:", error);
		} finally {
			setLoadingPending(false);
		}
	};

	const handleApprove = async (sheetId) => {
		try {
			await api.post(`/admin/sheets/${sheetId}/approve`);
			alert("Sheet approved successfully!");
			fetchAdminStats();
			fetchPendingApprovals();
		} catch (error) {
			console.error("Error approving sheet:", error);
			alert("Failed to approve sheet");
		}
	};

	const handleReject = async (sheetId) => {
		const reason = prompt("Please provide a reason for rejection:");
		if (!reason) return;

		try {
			await api.post(`/admin/sheets/${sheetId}/reject`, { reason });
			alert("Sheet approval rejected");
			fetchAdminStats();
			fetchPendingApprovals();
		} catch (error) {
			console.error("Error rejecting sheet:", error);
			alert("Failed to reject sheet");
		}
	};

	if (loading) {
		return <LoadingSpinner />;
	}

	return (
		<div className="min-h-screen bg-gray-50 dark:bg-gray-900">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
				{/* Header */}
				<div className="mb-8">
					<h1 className="text-3xl font-bold text-gray-900 dark:text-white">
						Admin Dashboard
					</h1>
					<p className="mt-2 text-gray-600 dark:text-gray-400">
						Manage global sheets, problems, and system settings
					</p>
				</div>

				{/* Stats Cards */}
				<div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
					<div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
						<div className="flex items-center">
							<div className="flex-shrink-0">
								<Users className="h-8 w-8 text-blue-600" />
							</div>
							<div className="ml-4">
								<p className="text-sm font-medium text-gray-600 dark:text-gray-400">
									Total Users
								</p>
								<p className="text-2xl font-bold text-gray-900 dark:text-white">
									{stats.totalUsers}
								</p>
							</div>
						</div>
					</div>

					<div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
						<div className="flex items-center">
							<div className="flex-shrink-0">
								<FileText className="h-8 w-8 text-green-600" />
							</div>
							<div className="ml-4">
								<p className="text-sm font-medium text-gray-600 dark:text-gray-400">
									Global Sheets
								</p>
								<p className="text-2xl font-bold text-gray-900 dark:text-white">
									{stats.globalSheets}
								</p>
							</div>
						</div>
					</div>

					<div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
						<div className="flex items-center">
							<div className="flex-shrink-0">
								<Code className="h-8 w-8 text-purple-600" />
							</div>
							<div className="ml-4">
								<p className="text-sm font-medium text-gray-600 dark:text-gray-400">
									Global Problems
								</p>
								<p className="text-2xl font-bold text-gray-900 dark:text-white">
									{stats.globalProblems}
								</p>
							</div>
						</div>
					</div>

					<div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
						<div className="flex items-center">
							<div className="flex-shrink-0">
								<Clock className="h-8 w-8 text-orange-600" />
							</div>
							<div className="ml-4">
								<p className="text-sm font-medium text-gray-600 dark:text-gray-400">
									Pending Approvals
								</p>
								<p className="text-2xl font-bold text-gray-900 dark:text-white">
									{stats.pendingApprovals || 0}
								</p>
							</div>
						</div>
					</div>
				</div>

				{/* Pending Approvals Section */}
				{loadingPending ? (
					<div className="mb-8">
						<LoadingSpinner />
					</div>
				) : pendingSheets.length > 0 ? (
					<div className="mb-8 bg-white dark:bg-gray-800 rounded-lg shadow p-6">
						<h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
							Pending Sheet Approval Requests
						</h2>
						<div className="space-y-4">
							{pendingSheets.map((sheet) => (
								<div
									key={sheet._id}
									className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
								>
									<div className="flex justify-between items-start">
										<div className="flex-1">
											<h3 className="text-lg font-semibold text-gray-900 dark:text-white">
												{sheet.name}
											</h3>
											<p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
												{sheet.description}
											</p>
											<div className="mt-2 flex items-center gap-4 text-sm">
												<span className="text-gray-600 dark:text-gray-400">
													Created by:{" "}
													<strong>{sheet.userId?.name || "Unknown"}</strong> (@
													{sheet.userId?.username})
												</span>
												<span className="text-gray-600 dark:text-gray-400">
													Category: <strong>{sheet.category}</strong>
												</span>
												<span className="text-gray-600 dark:text-gray-400">
													Problems:{" "}
													<strong>{sheet.problems?.length || 0}</strong>
												</span>
											</div>
											{sheet.tags && sheet.tags.length > 0 && (
												<div className="mt-2 flex flex-wrap gap-2">
													{sheet.tags.map((tag, idx) => (
														<span
															key={idx}
															className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded"
														>
															{tag}
														</span>
													))}
												</div>
											)}
											<p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
												Requested:{" "}
												{new Date(
													sheet.approvalRequestedAt
												).toLocaleDateString()}
											</p>
										</div>
										<div className="flex gap-2 ml-4">
											<Link
												to={`/sheets/${sheet._id}`}
												className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-50 dark:hover:bg-gray-700"
											>
												View Details
											</Link>
											<button
												onClick={() => handleApprove(sheet._id)}
												className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 flex items-center gap-1"
											>
												<CheckCircle className="h-4 w-4" />
												Approve
											</button>
											<button
												onClick={() => handleReject(sheet._id)}
												className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 flex items-center gap-1"
											>
												<XCircle className="h-4 w-4" />
												Reject
											</button>
										</div>
									</div>
								</div>
							))}
						</div>
					</div>
				) : null}

				{/* Quick Actions */}
				<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
					<div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
						<h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
							Sheet Management
						</h2>
						<p className="text-gray-600 dark:text-gray-400 mb-4">
							Create and manage global problem sheets visible to all users
						</p>
						<div className="space-y-3">
							<Link
								to="/admin/sheets"
								className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition duration-200"
							>
								<Settings className="mr-2 h-4 w-4" />
								Manage Sheets
							</Link>
							<div>
								<Link
									to="/admin/sheets"
									className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition duration-200"
								>
									<Plus className="mr-2 h-4 w-4" />
									Create New Sheet
								</Link>
							</div>
						</div>
					</div>

					<div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
						<h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
							Problem Management
						</h2>
						<p className="text-gray-600 dark:text-gray-400 mb-4">
							Add and manage global problems visible to all users
						</p>
						<div className="space-y-3">
							<Link
								to="/admin/problems"
								className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 transition duration-200"
							>
								<Settings className="mr-2 h-4 w-4" />
								Manage Problems
							</Link>
							<div>
								<Link
									to="/admin/problems"
									className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition duration-200"
								>
									<Plus className="mr-2 h-4 w-4" />
									Add New Problem
								</Link>
							</div>
						</div>
					</div>
				</div>

				{/* User Info */}
				<div className="mt-8 bg-white dark:bg-gray-800 rounded-lg shadow p-6">
					<h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
						Admin Information
					</h2>
					<div className="space-y-2 text-sm">
						<p className="text-gray-600 dark:text-gray-400">
							<strong>Logged in as:</strong> {user.name} ({user.username})
						</p>
						<p className="text-gray-600 dark:text-gray-400">
							<strong>Email:</strong> {user.email}
						</p>
						<p className="text-gray-600 dark:text-gray-400">
							<strong>Role:</strong> {user.role}
						</p>
					</div>
				</div>
			</div>
		</div>
	);
};

export default AdminDashboard;
