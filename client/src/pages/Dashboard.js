import React from "react";
import { useQuery } from "react-query";
import {
	TrendingUp,
	Target,
	Calendar,
	Award,
	Code2,
	Clock,
	BarChart3,
	Users,
	BookOpen,
	CheckCircle2,
	Circle,
	Loader,
	RefreshCw,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import api from "../utils/api";
import LoadingSpinner from "../components/UI/LoadingSpinner";
import Badge from "../components/UI/Badge";
import Button from "../components/UI/Button";
import {
	formatRelativeTime,
	getDifficultyColor,
	getPlatformColor,
} from "../utils/helpers";

const Dashboard = () => {
	const { user } = useAuth();
	const navigate = useNavigate();

	const {
		data: dashboardData,
		isLoading,
		refetch,
	} = useQuery(
		"dashboard",
		async () => {
			const response = await api.get("/dashboard");
			return response.data;
		},
		{
			staleTime: 30 * 1000, // 30 seconds
			cacheTime: 5 * 60 * 1000, // 5 minutes
			refetchOnMount: true,
			refetchOnWindowFocus: true,
		}
	);

	if (isLoading) {
		return (
			<div className="flex items-center justify-center min-h-96">
				<LoadingSpinner size="lg" />
			</div>
		);
	}

	const stats = dashboardData?.stats || {};
	const recentActivity = dashboardData?.recentActivity || [];
	const sheetsData = dashboardData?.sheets || {};
	const recentSheets = sheetsData?.recent || [];

	const statCards = [
		{
			title: "Problems Solved",
			value: stats.solvedCount || 0,
			change: `+${stats.weeklyProgress || 0} this week`,
			icon: CheckCircle2,
			color: "text-success-600 dark:text-success-400",
			bgColor: "bg-success-50 dark:bg-success-900/20",
		},
		{
			title: "Total Problems",
			value: stats.totalProblems || 0,
			change: `${stats.attemptedCount || 0} attempted`,
			icon: Code2,
			color: "text-primary-600 dark:text-primary-400",
			bgColor: "bg-primary-50 dark:bg-primary-900/20",
		},
		{
			title: "My Sheets",
			value: sheetsData?.summary?.totalSheets || 0,
			change: `${sheetsData?.summary?.publicSheets || 0} public`,
			icon: BookOpen,
			color: "text-purple-600 dark:text-purple-400",
			bgColor: "bg-purple-50 dark:bg-purple-900/20",
		},
		{
			title: "To Review",
			value: stats.reviewCount || 0,
			change: `${stats.todoCount || 0} todo`,
			icon: Circle,
			color: "text-orange-600 dark:text-orange-400",
			bgColor: "bg-orange-50 dark:bg-orange-900/20",
		},
	];

	const calculateProgress = (solved, total) => {
		if (total === 0) return 0;
		return Math.round((solved / total) * 100);
	};

	return (
		<div className="space-y-8">
			{/* Welcome Section */}
			<div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-lg p-6 text-white">
				<div className="flex items-center justify-between">
					<div>
						<h1 className="text-2xl font-bold mb-2">
							Welcome back, {user?.name}! 👋
						</h1>
						<p className="text-primary-100">
							Ready to continue your competitive programming journey?
						</p>
					</div>
					<Button
						variant="outline"
						size="sm"
						onClick={() => refetch()}
						className="bg-white/10 hover:bg-white/20 border-white/20 text-white"
					>
						<RefreshCw className="w-4 h-4 mr-2" />
						Refresh
					</Button>
				</div>
			</div>

			{/* Stats Grid */}
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
				{statCards.map((stat, index) => {
					const Icon = stat.icon;
					return (
						<div key={index} className="card hover:shadow-lg transition-shadow">
							<div className="card-content">
								<div className="flex items-center justify-between">
									<div>
										<p className="text-sm font-medium text-gray-600 dark:text-gray-400">
											{stat.title}
										</p>
										<p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
											{stat.value}
										</p>
										<p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
											{stat.change}
										</p>
									</div>
									<div className={`p-3 rounded-lg ${stat.bgColor}`}>
										<Icon className={`w-6 h-6 ${stat.color}`} />
									</div>
								</div>
							</div>
						</div>
					);
				})}
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
				{/* Main Content - Left Side */}
				<div className="lg:col-span-2 space-y-6">
					{/* Difficulty Breakdown */}
					<div className="card">
						<div className="card-header">
							<h3 className="card-title">Difficulty Breakdown</h3>
							<p className="card-description">Solved problems by difficulty</p>
						</div>
						<div className="card-content">
							<div className="space-y-4">
								{["easy", "medium", "hard"].map((difficulty) => {
									const count = stats.difficultyBreakdown?.[difficulty] || 0;
									const total = stats.solvedCount || 1;
									const percentage = Math.round((count / total) * 100) || 0;

									return (
										<div key={difficulty}>
											<div className="flex items-center justify-between mb-2">
												<Badge
													variant={
														difficulty === "easy"
															? "success"
															: difficulty === "medium"
															? "warning"
															: "danger"
													}
													className="capitalize"
												>
													{difficulty}
												</Badge>
												<span className="text-sm font-medium text-gray-900 dark:text-white">
													{count} ({percentage}%)
												</span>
											</div>
											<div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
												<div
													className={`h-2 rounded-full transition-all duration-300 ${
														difficulty === "easy"
															? "bg-success-600"
															: difficulty === "medium"
															? "bg-warning-600"
															: "bg-danger-600"
													}`}
													style={{ width: `${percentage}%` }}
												/>
											</div>
										</div>
									);
								})}
							</div>
						</div>
					</div>

					{/* Recent Sheets */}
					<div className="card">
						<div className="card-header">
							<div className="flex items-center justify-between">
								<div>
									<h3 className="card-title">Recent Sheets</h3>
									<p className="card-description">Your latest problem sheets</p>
								</div>
								<Button
									variant="outline"
									size="sm"
									onClick={() => navigate("/sheets")}
								>
									View All
								</Button>
							</div>
						</div>
						<div className="card-content">
							{recentSheets.length > 0 ? (
								<div className="space-y-3">
									{recentSheets.map((sheet) => {
										const progress = calculateProgress(
											sheet.solvedProblems,
											sheet.totalProblems
										);

										return (
											<div
												key={sheet._id}
												onClick={() => navigate(`/sheets/${sheet._id}`)}
												className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors cursor-pointer"
											>
												<div className="flex items-center justify-between mb-2">
													<div className="flex items-center space-x-2">
														<BookOpen className="w-4 h-4 text-primary-600 dark:text-primary-400" />
														<h4 className="font-medium text-gray-900 dark:text-white">
															{sheet.name}
														</h4>
													</div>
													<Badge variant="outline" className="capitalize">
														{sheet.category}
													</Badge>
												</div>
												<div className="flex items-center justify-between text-sm">
													<span className="text-gray-600 dark:text-gray-400">
														{sheet.solvedProblems}/{sheet.totalProblems}{" "}
														problems
													</span>
													<span className="font-medium text-primary-600 dark:text-primary-400">
														{progress}%
													</span>
												</div>
												<div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-1.5 mt-2">
													<div
														className="bg-primary-600 h-1.5 rounded-full transition-all duration-300"
														style={{ width: `${progress}%` }}
													/>
												</div>
											</div>
										);
									})}
								</div>
							) : (
								<div className="text-center py-8">
									<BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
									<p className="text-gray-500 dark:text-gray-400">
										No sheets yet
									</p>
									<Button className="mt-4" onClick={() => navigate("/sheets")}>
										Create Your First Sheet
									</Button>
								</div>
							)}
						</div>
					</div>

					{/* Recent Activity */}
					{/* Recent Activity */}
					<div className="card">
						<div className="card-header">
							<h3 className="card-title">Recent Activity</h3>
							<p className="card-description">Your latest solved problems</p>
						</div>
						<div className="card-content">
							{recentActivity.length > 0 ? (
								<div className="space-y-4">
									{recentActivity.slice(0, 5).map((activity, index) => (
										<div
											key={index}
											className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
										>
											<div className="flex items-center space-x-3">
												<div className="w-2 h-2 bg-success-500 rounded-full"></div>
												<div>
													<h4 className="font-medium text-gray-900 dark:text-white">
														{activity.title}
													</h4>
													<div className="flex items-center space-x-2 mt-1">
														<Badge
															variant="outline"
															size="sm"
															className="capitalize"
														>
															{activity.platform}
														</Badge>
														<Badge
															variant={
																activity.difficulty === "easy"
																	? "success"
																	: activity.difficulty === "medium"
																	? "warning"
																	: "danger"
															}
															size="sm"
															className="capitalize"
														>
															{activity.difficulty}
														</Badge>
													</div>
												</div>
											</div>
											<div className="text-sm text-gray-500 dark:text-gray-400">
												{formatRelativeTime(activity.solvedAt)}
											</div>
										</div>
									))}
								</div>
							) : (
								<div className="text-center py-8">
									<CheckCircle2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
									<p className="text-gray-500 dark:text-gray-400">
										No recent activity
									</p>
									<p className="text-sm text-gray-400">
										Start solving problems to see your activity here
									</p>
								</div>
							)}
						</div>
					</div>
				</div>

				{/* Quick Actions & Stats */}
				<div className="space-y-6">
					{/* Quick Actions */}
					<div className="card">
						<div className="card-header">
							<h3 className="card-title">Quick Actions</h3>
						</div>
						<div className="card-content">
							<div className="space-y-3">
								<button
									onClick={() => navigate("/sheets")}
									className="w-full flex items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
								>
									<BookOpen className="w-5 h-5 text-primary-600 dark:text-primary-400 mr-3" />
									<span className="font-medium text-gray-900 dark:text-white">
										Browse Sheets
									</span>
								</button>
								<button
									onClick={() => navigate("/problems")}
									className="w-full flex items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
								>
									<Code2 className="w-5 h-5 text-primary-600 dark:text-primary-400 mr-3" />
									<span className="font-medium text-gray-900 dark:text-white">
										View Problems
									</span>
								</button>
								<button
									onClick={() => navigate("/integrations")}
									className="w-full flex items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
								>
									<BarChart3 className="w-5 h-5 text-primary-600 dark:text-primary-400 mr-3" />
									<span className="font-medium text-gray-900 dark:text-white">
										Sync Platforms
									</span>
								</button>
								<button
									onClick={() => navigate("/profile")}
									className="w-full flex items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
								>
									<Users className="w-5 h-5 text-primary-600 dark:text-primary-400 mr-3" />
									<span className="font-medium text-gray-900 dark:text-white">
										View Profile
									</span>
								</button>
							</div>
						</div>
					</div>

					{/* Platform Stats */}
					<div className="card">
						<div className="card-header">
							<h3 className="card-title">Platform Breakdown</h3>
							<p className="card-description">Solved by platform</p>
						</div>
						<div className="card-content">
							<div className="space-y-3">
								{Object.keys(stats.platformBreakdown || {}).length > 0 ? (
									Object.entries(stats.platformBreakdown || {}).map(
										([platform, count]) => (
											<div
												key={platform}
												className="flex items-center justify-between"
											>
												<div className="flex items-center space-x-2">
													<Badge variant="outline" className="capitalize">
														{platform}
													</Badge>
												</div>
												<span className="font-medium text-gray-900 dark:text-white">
													{count}
												</span>
											</div>
										)
									)
								) : (
									<p className="text-gray-500 dark:text-gray-400 text-sm text-center py-4">
										No platform data yet. Start solving problems!
									</p>
								)}
							</div>
						</div>
					</div>

					{/* Top Tags */}
					<div className="card">
						<div className="card-header">
							<h3 className="card-title">Top Tags</h3>
							<p className="card-description">Most practiced topics</p>
						</div>
						<div className="card-content">
							<div className="space-y-2">
								{(stats.topTags || []).length > 0 ? (
									(stats.topTags || []).slice(0, 5).map((tag, index) => (
										<div
											key={index}
											className="flex items-center justify-between"
										>
											<Badge variant="outline" size="sm">
												{tag._id}
											</Badge>
											<span className="text-sm text-gray-600 dark:text-gray-400">
												{tag.count}
											</span>
										</div>
									))
								) : (
									<p className="text-gray-500 dark:text-gray-400 text-sm text-center py-4">
										No tags data yet. Solve more problems!
									</p>
								)}
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

export default Dashboard;
