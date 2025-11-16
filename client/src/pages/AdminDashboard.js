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
	BarChart3,
	Activity,
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
	const [selectedSheets, setSelectedSheets] = useState([]);
	const [analytics, setAnalytics] = useState(null);
	const [serverHealth, setServerHealth] = useState(null);

	useEffect(() => {
		console.log("AdminDashboard - Fetching stats for admin user");
		fetchAdminStats();
		fetchPendingApprovals();
		fetchAnalytics();
		fetchServerHealth();
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

	const fetchAnalytics = async () => {
		try {
			const [userAnalytics, contentAnalytics] = await Promise.all([
				api.get("/admin/analytics/users"),
				api.get("/admin/analytics/content"),
			]);
			setAnalytics({
				users: userAnalytics.data,
				content: contentAnalytics.data,
			});
		} catch (error) {
			console.error("Error fetching analytics:", error);
		}
	};

	const fetchServerHealth = async () => {
		try {
			const response = await api.get("/admin/analytics/health");
			setServerHealth(response.data);
		} catch (error) {
			console.error("Error fetching server health:", error);
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

	const handleBulkApprove = async () => {
		if (selectedSheets.length === 0) {
			alert("Please select sheets to approve");
			return;
		}

		if (
			!window.confirm(`Approve ${selectedSheets.length} selected sheet(s)?`)
		) {
			return;
		}

		try {
			await api.post("/admin/sheets/bulk-approve", {
				sheetIds: selectedSheets,
			});
			alert(`Successfully approved ${selectedSheets.length} sheet(s)!`);
			setSelectedSheets([]);
			fetchAdminStats();
			fetchPendingApprovals();
		} catch (error) {
			console.error("Error bulk approving sheets:", error);
			alert("Failed to bulk approve sheets");
		}
	};

	const handleBulkReject = async () => {
		if (selectedSheets.length === 0) {
			alert("Please select sheets to reject");
			return;
		}

		const reason = prompt("Please provide a reason for rejection:");
		if (!reason) return;

		try {
			await api.post("/admin/sheets/bulk-reject", {
				sheetIds: selectedSheets,
				reason,
			});
			alert(`Successfully rejected ${selectedSheets.length} sheet(s)!`);
			setSelectedSheets([]);
			fetchAdminStats();
			fetchPendingApprovals();
		} catch (error) {
			console.error("Error bulk rejecting sheets:", error);
			alert("Failed to bulk reject sheets");
		}
	};

	const toggleSheetSelection = (sheetId) => {
		setSelectedSheets((prev) =>
			prev.includes(sheetId)
				? prev.filter((id) => id !== sheetId)
				: [...prev, sheetId]
		);
	};

	const selectAllSheets = () => {
		if (selectedSheets.length === pendingSheets.length) {
			setSelectedSheets([]);
		} else {
			setSelectedSheets(pendingSheets.map((s) => s._id));
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
						<div className="flex justify-between items-center mb-4">
							<h2 className="text-xl font-semibold text-gray-900 dark:text-white">
								Pending Sheet Approval Requests
							</h2>
							<div className="flex gap-2">
								<button
									onClick={selectAllSheets}
									className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-50 dark:hover:bg-gray-700"
								>
									{selectedSheets.length === pendingSheets.length
										? "Deselect All"
										: "Select All"}
								</button>
								{selectedSheets.length > 0 && (
									<>
										<button
											onClick={handleBulkApprove}
											className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 flex items-center gap-1"
										>
											<CheckCircle className="h-4 w-4" />
											Approve ({selectedSheets.length})
										</button>
										<button
											onClick={handleBulkReject}
											className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 flex items-center gap-1"
										>
											<XCircle className="h-4 w-4" />
											Reject ({selectedSheets.length})
										</button>
									</>
								)}
							</div>
						</div>
						<div className="space-y-4">
							{pendingSheets.map((sheet) => (
								<div
									key={sheet._id}
									className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
								>
									<div className="flex justify-between items-start">
										<div className="flex items-start gap-3 flex-1">
											<input
												type="checkbox"
												checked={selectedSheets.includes(sheet._id)}
												onChange={() => toggleSheetSelection(sheet._id)}
												className="mt-1 h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
											/>
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
														<strong>{sheet.userId?.name || "Unknown"}</strong>{" "}
														(@
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

				{/* Analytics Section */}
				{analytics && (
					<>
						{/* User Analytics */}
						<div className="mt-8 bg-white dark:bg-gray-800 rounded-lg shadow p-6">
							<h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
								<BarChart3 className="h-5 w-5" />
								User Analytics (DAU/MAU)
							</h2>
							<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
								<div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
									<p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
										{analytics.users.dau}
									</p>
									<p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
										Daily Active Users
									</p>
								</div>
								<div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
									<p className="text-2xl font-bold text-green-600 dark:text-green-400">
										{analytics.users.wau}
									</p>
									<p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
										Weekly Active Users
									</p>
								</div>
								<div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
									<p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
										{analytics.users.mau}
									</p>
									<p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
										Monthly Active Users
									</p>
								</div>
								<div className="text-center p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
									<p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
										{analytics.users.activeUsersPercent}%
									</p>
									<p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
										Active Today
									</p>
								</div>
							</div>
							<div className="mt-4 grid grid-cols-3 gap-4">
								<div className="text-center p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
									<p className="text-lg font-semibold text-gray-900 dark:text-white">
										{analytics.users.newUsersToday}
									</p>
									<p className="text-xs text-gray-600 dark:text-gray-400">
										New Today
									</p>
								</div>
								<div className="text-center p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
									<p className="text-lg font-semibold text-gray-900 dark:text-white">
										{analytics.users.newUsersWeek}
									</p>
									<p className="text-xs text-gray-600 dark:text-gray-400">
										New This Week
									</p>
								</div>
								<div className="text-center p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
									<p className="text-lg font-semibold text-gray-900 dark:text-white">
										{analytics.users.newUsersMonth}
									</p>
									<p className="text-xs text-gray-600 dark:text-gray-400">
										New This Month
									</p>
								</div>
							</div>
							{analytics.users.bannedUsers > 0 && (
								<div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
									<p className="text-sm text-red-800 dark:text-red-200">
										⚠️ <strong>{analytics.users.bannedUsers}</strong> banned
										user(s)
									</p>
								</div>
							)}
						</div>

						{/* Content Analytics */}
						<div className="mt-8 bg-white dark:bg-gray-800 rounded-lg shadow p-6">
							<h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
								Popular Content
							</h2>
							<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
								{/* Popular Problems */}
								<div>
									<h3 className="text-md font-medium text-gray-900 dark:text-white mb-3">
										Most Solved Problems
									</h3>
									{analytics.content.popularProblems.length > 0 ? (
										<div className="space-y-2">
											{analytics.content.popularProblems
												.slice(0, 5)
												.map((problem, idx) => (
													<div
														key={idx}
														className="flex items-center justify-between p-2 border border-gray-200 dark:border-gray-700 rounded"
													>
														<div className="flex-1 min-w-0">
															<p className="text-sm font-medium text-gray-900 dark:text-white truncate">
																{idx + 1}. {problem.title}
															</p>
															<p className="text-xs text-gray-500">
																{problem.platform} • {problem.difficulty}
															</p>
														</div>
														<span className="ml-2 text-sm font-semibold text-primary-600">
															{problem.solveCount}
														</span>
													</div>
												))}
										</div>
									) : (
										<p className="text-sm text-gray-500 dark:text-gray-400">
											No data available
										</p>
									)}
								</div>

								{/* Popular Sheets */}
								<div>
									<h3 className="text-md font-medium text-gray-900 dark:text-white mb-3">
										Most Popular Sheets
									</h3>
									{analytics.content.popularSheets.length > 0 ? (
										<div className="space-y-2">
											{analytics.content.popularSheets
												.slice(0, 5)
												.map((sheet, idx) => (
													<div
														key={idx}
														className="flex items-center justify-between p-2 border border-gray-200 dark:border-gray-700 rounded"
													>
														<div className="flex-1 min-w-0">
															<p className="text-sm font-medium text-gray-900 dark:text-white truncate">
																{idx + 1}. {sheet.name}
															</p>
															<p className="text-xs text-gray-500">
																{sheet.problemCount} problems • {sheet.category}
															</p>
														</div>
														<span className="ml-2 text-sm font-semibold text-green-600">
															{sheet.userCount} users
														</span>
													</div>
												))}
										</div>
									) : (
										<p className="text-sm text-gray-500 dark:text-gray-400">
											No data available
										</p>
									)}
								</div>
							</div>
						</div>
					</>
				)}

				{/* Server Health */}
				{serverHealth && (
					<div className="mt-8 bg-white dark:bg-gray-800 rounded-lg shadow p-6">
						<h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
							<Activity className="h-5 w-5 text-green-600" />
							Server Health
						</h2>
						<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
							<div className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
								<p className="text-xs text-gray-600 dark:text-gray-400">
									Uptime
								</p>
								<p className="text-lg font-semibold text-gray-900 dark:text-white">
									{Math.floor(serverHealth.server.uptime / 3600)}h{" "}
									{Math.floor((serverHealth.server.uptime % 3600) / 60)}m
								</p>
							</div>
							<div className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
								<p className="text-xs text-gray-600 dark:text-gray-400">
									Memory Used
								</p>
								<p className="text-lg font-semibold text-gray-900 dark:text-white">
									{(
										serverHealth.server.memory.processHeap /
										(1024 * 1024)
									).toFixed(0)}{" "}
									MB
								</p>
							</div>
							<div className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
								<p className="text-xs text-gray-600 dark:text-gray-400">
									DB Status
								</p>
								<p className="text-lg font-semibold text-green-600">
									{serverHealth.database.status}
								</p>
							</div>
							<div className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
								<p className="text-xs text-gray-600 dark:text-gray-400">
									Node Version
								</p>
								<p className="text-lg font-semibold text-gray-900 dark:text-white">
									{serverHealth.server.nodeVersion}
								</p>
							</div>
						</div>
					</div>
				)}

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
