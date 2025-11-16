import React from "react";
import { NavLink, useLocation } from "react-router-dom";
import { useQuery } from "react-query";
import {
	LayoutDashboard,
	Code2,
	FileText,
	User,
	Settings,
	Link as LinkIcon,
	BarChart3,
	Trophy,
	Award,
} from "lucide-react";
import { cn } from "../../utils/helpers";
import api from "../../utils/api";
import { useAuth } from "../../contexts/AuthContext";

const Sidebar = () => {
	const location = useLocation();
	const { user } = useAuth();

	// Fetch dashboard data for quick stats
	const { data: dashboardData } = useQuery(
		"dashboard",
		async () => {
			const response = await api.get("/dashboard");
			return response.data;
		},
		{
			staleTime: 30 * 1000, // 30 seconds
			cacheTime: 5 * 60 * 1000, // 5 minutes
			refetchOnMount: false,
			refetchOnWindowFocus: false,
		}
	);

	const stats = dashboardData?.stats || {};

	const navigation = [
		{
			name: "Dashboard",
			href: "/dashboard",
			icon: LayoutDashboard,
			current: location.pathname === "/dashboard",
		},
		{
			name: "Problems",
			href: "/problems",
			icon: Code2,
			current: location.pathname.startsWith("/problems"),
		},
		{
			name: "Sheets",
			href: "/sheets",
			icon: FileText,
			current: location.pathname.startsWith("/sheets"),
		},
		{
			name: "Contests",
			href: "/contests",
			icon: Trophy,
			current: location.pathname === "/contests",
		},
		{
			name: "Profile",
			href: "/profile",
			icon: User,
			current: location.pathname === "/profile",
		},
		{
			name: "Integrations",
			href: "/integrations",
			icon: LinkIcon,
			current: location.pathname === "/integrations",
		},
		{
			name: "Settings",
			href: "/settings",
			icon: Settings,
			current: location.pathname === "/settings",
		},
	];

	const quickStats = [
		{
			name: "Problems Solved",
			value: stats.solvedCount || "0",
			icon: Award,
			color: "text-success-600 dark:text-success-400",
		},
		{
			name: "Current Streak",
			value: user?.stats?.currentStreak || "0",
			icon: BarChart3,
			color: "text-primary-600 dark:text-primary-400",
		},
	];

	return (
		<>
			{/* Desktop sidebar */}
			<aside className="fixed top-0 left-0 z-40 w-64 h-screen pt-20 transition-transform -translate-x-full bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 lg:translate-x-0">
				<div className="h-full px-3 pb-4 overflow-y-auto bg-white dark:bg-gray-800">
					{/* Navigation */}
					<ul className="space-y-2 font-medium">
						{navigation.map((item) => {
							const Icon = item.icon;
							return (
								<li key={item.name}>
									<NavLink
										to={item.href}
										className={({ isActive }) =>
											cn(
												"flex items-center p-2 text-gray-900 dark:text-gray-100 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 group transition-colors",
												isActive &&
													"bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 hover:bg-primary-100 dark:hover:bg-primary-900/50"
											)
										}
									>
										<Icon className="w-5 h-5 text-gray-500 transition duration-75 group-hover:text-gray-900" />
										<span className="ml-3">{item.name}</span>
									</NavLink>
								</li>
							);
						})}
					</ul>

					{/* Quick Stats */}
					<div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700">
						<h3 className="px-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">
							Quick Stats
						</h3>
						<div className="space-y-3">
							{quickStats.map((stat) => {
								const Icon = stat.icon;
								return (
									<div
										key={stat.name}
										className="flex items-center p-2 rounded-lg bg-gray-50 dark:bg-gray-700"
									>
										<Icon className={cn("w-4 h-4", stat.color)} />
										<div className="ml-3">
											<div className="text-sm font-medium text-gray-900 dark:text-white">
												{stat.value}
											</div>
											<div className="text-xs text-gray-500 dark:text-gray-400">
												{stat.name}
											</div>
										</div>
									</div>
								);
							})}
						</div>
					</div>

					{/* Recent Activity */}
					<div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700">
						<h3 className="px-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">
							Recent Activity
						</h3>
						<div className="space-y-2">
							{dashboardData?.recentActivity &&
							dashboardData.recentActivity.length > 0 ? (
								dashboardData.recentActivity
									.slice(0, 2)
									.map((activity, index) => (
										<div
											key={index}
											className="p-2 rounded-lg bg-gray-50 dark:bg-gray-700"
										>
											<div className="text-sm font-medium text-gray-900 dark:text-white truncate">
												{activity.title}
											</div>
											<div className="text-xs text-gray-500 dark:text-gray-400 capitalize">
												Solved • {activity.platform}
											</div>
										</div>
									))
							) : (
								<div className="p-2 text-center">
									<div className="text-xs text-gray-500 dark:text-gray-400">
										No recent activity
									</div>
								</div>
							)}
						</div>
					</div>
				</div>
			</aside>

			{/* Mobile sidebar backdrop */}
			<div className="fixed inset-0 z-30 bg-gray-900 bg-opacity-50 lg:hidden" />
		</>
	);
};

export default Sidebar;
