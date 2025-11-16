import React, { useState, useEffect } from "react";
import {
	Users,
	Search,
	Ban,
	AlertTriangle,
	Shield,
	Activity,
	CheckCircle,
	XCircle,
	Eye,
	Filter,
	ChevronLeft,
	ChevronRight,
} from "lucide-react";
import LoadingSpinner from "../components/UI/LoadingSpinner";
import Button from "../components/UI/Button";
import Badge from "../components/UI/Badge";
import api from "../utils/api";

const AdminUsers = () => {
	const [users, setUsers] = useState([]);
	const [loading, setLoading] = useState(true);
	const [searchQuery, setSearchQuery] = useState("");
	const [statusFilter, setStatusFilter] = useState("all");
	const [sortBy, setSortBy] = useState("createdAt");
	const [page, setPage] = useState(1);
	const [totalPages, setTotalPages] = useState(1);
	const [total, setTotal] = useState(0);
	const [selectedUser, setSelectedUser] = useState(null);
	const [showActivityModal, setShowActivityModal] = useState(false);
	const [userActivity, setUserActivity] = useState(null);

	useEffect(() => {
		fetchUsers();
	}, [page, statusFilter, sortBy]);

	const fetchUsers = async () => {
		setLoading(true);
		try {
			const response = await api.get("/admin/users", {
				params: {
					page,
					limit: 20,
					search: searchQuery,
					status: statusFilter,
					sortBy,
				},
			});
			setUsers(response.data.users);
			setTotal(response.data.total);
			setTotalPages(response.data.totalPages);
		} catch (error) {
			console.error("Error fetching users:", error);
			alert("Failed to fetch users");
		} finally {
			setLoading(false);
		}
	};

	const handleSearch = () => {
		setPage(1);
		fetchUsers();
	};

	const handleBanUser = async (userId) => {
		const reason = prompt("Enter reason for banning this user:");
		if (!reason) return;

		const durationStr = prompt("Enter ban duration in days (0 for permanent):");
		const duration = parseInt(durationStr) || 0;

		try {
			await api.post(`/admin/users/${userId}/ban`, { reason, duration });
			alert("User banned successfully");
			fetchUsers();
		} catch (error) {
			console.error("Error banning user:", error);
			alert("Failed to ban user");
		}
	};

	const handleUnbanUser = async (userId) => {
		if (!window.confirm("Are you sure you want to unban this user?")) return;

		try {
			await api.post(`/admin/users/${userId}/unban`);
			alert("User unbanned successfully");
			fetchUsers();
		} catch (error) {
			console.error("Error unbanning user:", error);
			alert("Failed to unban user");
		}
	};

	const handleWarnUser = async (userId) => {
		const message = prompt("Enter warning message:");
		if (!message) return;

		try {
			await api.post(`/admin/users/${userId}/warn`, { message });
			alert("Warning issued successfully");
			fetchUsers();
		} catch (error) {
			console.error("Error warning user:", error);
			alert("Failed to issue warning");
		}
	};

	const viewUserActivity = async (userId) => {
		try {
			const response = await api.get(`/admin/users/${userId}/activity`);
			setUserActivity(response.data);
			setSelectedUser(users.find((u) => u._id === userId));
			setShowActivityModal(true);
		} catch (error) {
			console.error("Error fetching user activity:", error);
			alert("Failed to fetch user activity");
		}
	};

	const formatDate = (date) => {
		return new Date(date).toLocaleDateString("en-US", {
			year: "numeric",
			month: "short",
			day: "numeric",
		});
	};

	return (
		<div className="space-y-6">
			{/* Header */}
			<div>
				<h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
					<Users className="w-8 h-8 text-primary-600 dark:text-primary-400" />
					User Management
				</h1>
				<p className="text-gray-600 dark:text-gray-400 mt-1">
					View and manage all users, ban/warn users, and view activity logs
				</p>
			</div>

			{/* Stats */}
			<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
				<div className="card">
					<div className="card-content">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-sm text-gray-600 dark:text-gray-400">
									Total Users
								</p>
								<p className="text-2xl font-bold text-gray-900 dark:text-white">
									{total}
								</p>
							</div>
							<Users className="w-8 h-8 text-blue-600" />
						</div>
					</div>
				</div>
				<div className="card">
					<div className="card-content">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-sm text-gray-600 dark:text-gray-400">
									Active Users
								</p>
								<p className="text-2xl font-bold text-gray-900 dark:text-white">
									{users.filter((u) => !u.isBanned).length}
								</p>
							</div>
							<CheckCircle className="w-8 h-8 text-green-600" />
						</div>
					</div>
				</div>
				<div className="card">
					<div className="card-content">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-sm text-gray-600 dark:text-gray-400">
									Banned Users
								</p>
								<p className="text-2xl font-bold text-gray-900 dark:text-white">
									{users.filter((u) => u.isBanned).length}
								</p>
							</div>
							<Ban className="w-8 h-8 text-red-600" />
						</div>
					</div>
				</div>
				<div className="card">
					<div className="card-content">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-sm text-gray-600 dark:text-gray-400">
									With Warnings
								</p>
								<p className="text-2xl font-bold text-gray-900 dark:text-white">
									{
										users.filter((u) => u.warnings && u.warnings.length > 0)
											.length
									}
								</p>
							</div>
							<AlertTriangle className="w-8 h-8 text-orange-600" />
						</div>
					</div>
				</div>
			</div>

			{/* Filters */}
			<div className="card">
				<div className="card-content">
					<div className="flex flex-col md:flex-row gap-4">
						{/* Search */}
						<div className="flex-1">
							<div className="relative">
								<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
								<input
									type="text"
									placeholder="Search by name, email, or username..."
									value={searchQuery}
									onChange={(e) => setSearchQuery(e.target.value)}
									onKeyPress={(e) => e.key === "Enter" && handleSearch()}
									className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-800 dark:text-white"
								/>
							</div>
						</div>

						{/* Status Filter */}
						<div className="flex items-center gap-2">
							<Filter className="w-5 h-5 text-gray-400" />
							<select
								value={statusFilter}
								onChange={(e) => {
									setStatusFilter(e.target.value);
									setPage(1);
								}}
								className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-800 dark:text-white"
							>
								<option value="all">All Users</option>
								<option value="active">Active Only</option>
								<option value="banned">Banned Only</option>
							</select>
						</div>

						{/* Sort By */}
						<select
							value={sortBy}
							onChange={(e) => {
								setSortBy(e.target.value);
								setPage(1);
							}}
							className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-800 dark:text-white"
						>
							<option value="createdAt">Newest First</option>
							<option value="name">Name (A-Z)</option>
							<option value="solved">Most Solved</option>
							<option value="streak">Highest Streak</option>
						</select>

						{/* Search Button */}
						<Button onClick={handleSearch} variant="primary">
							Search
						</Button>
					</div>
				</div>
			</div>

			{/* Users Table */}
			{loading ? (
				<LoadingSpinner />
			) : users.length === 0 ? (
				<div className="card">
					<div className="card-content text-center py-12">
						<Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
						<p className="text-gray-600 dark:text-gray-400">No users found</p>
					</div>
				</div>
			) : (
				<div className="card">
					<div className="overflow-x-auto">
						<table className="w-full">
							<thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
								<tr>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
										User
									</th>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
										Stats
									</th>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
										Status
									</th>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
										Joined
									</th>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
										Actions
									</th>
								</tr>
							</thead>
							<tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
								{users.map((user) => (
									<tr
										key={user._id}
										className="hover:bg-gray-50 dark:hover:bg-gray-800"
									>
										<td className="px-6 py-4 whitespace-nowrap">
											<div className="flex items-center">
												<div className="flex-shrink-0 h-10 w-10">
													<div className="h-10 w-10 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center">
														<span className="text-primary-600 dark:text-primary-400 font-semibold">
															{user.name?.charAt(0).toUpperCase()}
														</span>
													</div>
												</div>
												<div className="ml-4">
													<div className="text-sm font-medium text-gray-900 dark:text-white">
														{user.name}
													</div>
													<div className="text-sm text-gray-500 dark:text-gray-400">
														{user.email}
													</div>
													<div className="text-xs text-gray-400 dark:text-gray-500">
														@{user.username}
													</div>
												</div>
											</div>
										</td>
										<td className="px-6 py-4 whitespace-nowrap">
											<div className="text-sm text-gray-900 dark:text-white">
												<div>Solved: {user.stats?.totalSolved || 0}</div>
												<div>Streak: {user.stats?.currentStreak || 0}</div>
												<div className="text-xs text-gray-500">
													Problems: {user.problemCount || 0} | Sheets:{" "}
													{user.sheetCount || 0}
												</div>
											</div>
										</td>
										<td className="px-6 py-4 whitespace-nowrap">
											<div className="space-y-1">
												{user.isBanned ? (
													<Badge variant="danger">
														<Ban className="w-3 h-3 mr-1" />
														Banned
													</Badge>
												) : (
													<Badge variant="success">
														<CheckCircle className="w-3 h-3 mr-1" />
														Active
													</Badge>
												)}
												{user.warnings && user.warnings.length > 0 && (
													<Badge variant="warning">
														<AlertTriangle className="w-3 h-3 mr-1" />
														{user.warnings.length} Warning(s)
													</Badge>
												)}
												{user.username === "admin" && (
													<Badge variant="primary">
														<Shield className="w-3 h-3 mr-1" />
														Admin
													</Badge>
												)}
											</div>
										</td>
										<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
											{formatDate(user.createdAt)}
										</td>
										<td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
											<button
												onClick={() => viewUserActivity(user._id)}
												className="text-blue-600 hover:text-blue-900 dark:text-blue-400"
												title="View Activity"
											>
												<Activity className="w-5 h-5" />
											</button>
											{user.username !== "admin" && (
												<>
													<button
														onClick={() => handleWarnUser(user._id)}
														className="text-orange-600 hover:text-orange-900 dark:text-orange-400"
														title="Warn User"
													>
														<AlertTriangle className="w-5 h-5" />
													</button>
													{user.isBanned ? (
														<button
															onClick={() => handleUnbanUser(user._id)}
															className="text-green-600 hover:text-green-900 dark:text-green-400"
															title="Unban User"
														>
															<CheckCircle className="w-5 h-5" />
														</button>
													) : (
														<button
															onClick={() => handleBanUser(user._id)}
															className="text-red-600 hover:text-red-900 dark:text-red-400"
															title="Ban User"
														>
															<Ban className="w-5 h-5" />
														</button>
													)}
												</>
											)}
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				</div>
			)}

			{/* Pagination */}
			{totalPages > 1 && (
				<div className="flex items-center justify-between">
					<p className="text-sm text-gray-600 dark:text-gray-400">
						Showing {users.length} of {total} users
					</p>
					<div className="flex gap-2">
						<Button
							onClick={() => setPage((p) => Math.max(1, p - 1))}
							disabled={page === 1}
							variant="outline"
							size="sm"
						>
							<ChevronLeft className="w-4 h-4" />
							Previous
						</Button>
						<span className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300">
							Page {page} of {totalPages}
						</span>
						<Button
							onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
							disabled={page === totalPages}
							variant="outline"
							size="sm"
						>
							Next
							<ChevronRight className="w-4 h-4" />
						</Button>
					</div>
				</div>
			)}

			{/* Activity Modal */}
			{showActivityModal && selectedUser && userActivity && (
				<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
					<div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
						<div className="p-6">
							<div className="flex items-center justify-between mb-6">
								<h2 className="text-2xl font-bold text-gray-900 dark:text-white">
									Activity Log - {selectedUser.name}
								</h2>
								<button
									onClick={() => setShowActivityModal(false)}
									className="text-gray-500 hover:text-gray-700 dark:text-gray-400"
								>
									<XCircle className="w-6 h-6" />
								</button>
							</div>

							{/* Activity Summary */}
							<div className="grid grid-cols-3 gap-4 mb-6">
								<div className="card">
									<div className="card-content text-center">
										<p className="text-2xl font-bold text-primary-600">
											{userActivity.activitySummary.totalProblemsSolved}
										</p>
										<p className="text-sm text-gray-600 dark:text-gray-400">
											Problems Solved
										</p>
									</div>
								</div>
								<div className="card">
									<div className="card-content text-center">
										<p className="text-2xl font-bold text-green-600">
											{userActivity.activitySummary.totalSheets}
										</p>
										<p className="text-sm text-gray-600 dark:text-gray-400">
											Sheets Created
										</p>
									</div>
								</div>
								<div className="card">
									<div className="card-content text-center">
										<p className="text-2xl font-bold text-blue-600">
											{userActivity.activitySummary.accountAge}
										</p>
										<p className="text-sm text-gray-600 dark:text-gray-400">
											Days Active
										</p>
									</div>
								</div>
							</div>

							{/* Recent Problems */}
							<div className="mb-6">
								<h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
									Recent Problems Solved
								</h3>
								{userActivity.recentProblems.length > 0 ? (
									<div className="space-y-2">
										{userActivity.recentProblems.map((problem, idx) => (
											<div
												key={idx}
												className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg"
											>
												<div className="flex items-center justify-between">
													<div>
														<p className="font-medium text-gray-900 dark:text-white">
															{problem.title}
														</p>
														<div className="flex gap-2 mt-1">
															<Badge variant="outline">
																{problem.platform}
															</Badge>
															<Badge
																variant={
																	problem.difficulty === "easy"
																		? "success"
																		: problem.difficulty === "medium"
																		? "warning"
																		: "danger"
																}
															>
																{problem.difficulty}
															</Badge>
														</div>
													</div>
													<p className="text-sm text-gray-500">
														{formatDate(problem.solvedAt)}
													</p>
												</div>
											</div>
										))}
									</div>
								) : (
									<p className="text-gray-500 dark:text-gray-400">
										No problems solved yet
									</p>
								)}
							</div>

							{/* Sheets */}
							<div>
								<h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
									Created Sheets
								</h3>
								{userActivity.sheets.length > 0 ? (
									<div className="space-y-2">
										{userActivity.sheets.map((sheet, idx) => (
											<div
												key={idx}
												className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg"
											>
												<div className="flex items-center justify-between">
													<div>
														<p className="font-medium text-gray-900 dark:text-white">
															{sheet.name}
														</p>
														<div className="flex gap-2 mt-1">
															<Badge variant="outline">{sheet.category}</Badge>
															{sheet.isGlobal && (
																<Badge variant="primary">Global</Badge>
															)}
														</div>
													</div>
													<p className="text-sm text-gray-500">
														{formatDate(sheet.createdAt)}
													</p>
												</div>
											</div>
										))}
									</div>
								) : (
									<p className="text-gray-500 dark:text-gray-400">
										No sheets created yet
									</p>
								)}
							</div>
						</div>
					</div>
				</div>
			)}
		</div>
	);
};

export default AdminUsers;
