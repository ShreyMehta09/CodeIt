import React, { useState, useEffect } from "react";
import {
	Calendar,
	Clock,
	ExternalLink,
	Trophy,
	Filter,
	Search,
	RefreshCw,
} from "lucide-react";
import LoadingSpinner from "../components/UI/LoadingSpinner";
import Badge from "../components/UI/Badge";
import Button from "../components/UI/Button";

const Contests = () => {
	const [contests, setContests] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const [selectedPlatform, setSelectedPlatform] = useState("all");
	const [searchQuery, setSearchQuery] = useState("");
	const [lastUpdated, setLastUpdated] = useState(null);

	const fetchContests = async () => {
		setLoading(true);
		setError(null);
		try {
			const response = await fetch("http://localhost:8000/api/contests/upcoming");
			if (!response.ok) throw new Error("Failed to fetch contests");
			const data = await response.json();
			setContests(data.contests);
			setLastUpdated(data.lastUpdated);
		} catch (err) {
			setError("Failed to fetch contests. Please try again later.");
			console.error("Error fetching contests:", err);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchContests();
	}, []);

	const formatDate = (timestamp) => {
		const date = new Date(timestamp * 1000);
		return date.toLocaleDateString("en-US", {
			weekday: "short",
			year: "numeric",
			month: "short",
			day: "numeric",
		});
	};

	const formatTime = (timestamp) => {
		const date = new Date(timestamp * 1000);
		return date.toLocaleTimeString("en-US", {
			hour: "2-digit",
			minute: "2-digit",
			hour12: true,
		});
	};

	const formatDuration = (seconds) => {
		const hours = Math.floor(seconds / 3600);
		const minutes = Math.floor((seconds % 3600) / 60);
		if (hours > 0 && minutes > 0) {
			return `${hours}h ${minutes}m`;
		} else if (hours > 0) {
			return `${hours}h`;
		} else {
			return `${minutes}m`;
		}
	};

	const getTimeUntilStart = (timestamp) => {
		const now = Date.now() / 1000;
		const diff = timestamp - now;

		if (diff < 0) return "Started";

		const days = Math.floor(diff / 86400);
		const hours = Math.floor((diff % 86400) / 3600);
		const minutes = Math.floor((diff % 3600) / 60);

		if (days > 0) {
			return `in ${days}d ${hours}h`;
		} else if (hours > 0) {
			return `in ${hours}h ${minutes}m`;
		} else {
			return `in ${minutes}m`;
		}
	};

	const getPlatformColor = (platform) => {
		const colors = {
			codeforces: "primary",
			leetcode: "warning",
			codechef: "danger",
			atcoder: "success",
			hackerrank: "default",
		};
		return colors[platform.toLowerCase()] || "default";
	};

	const getStatusBorderColor = (timestamp) => {
		const now = Date.now() / 1000;
		const diff = timestamp - now;

		if (diff < 0) return "border-l-red-500";
		if (diff < 3600) return "border-l-orange-500"; // Starting in < 1 hour
		if (diff < 86400) return "border-l-yellow-500"; // Starting in < 1 day
		return "border-l-green-500";
	};

	// Filter contests
	const filteredContests = contests.filter((contest) => {
		const matchesPlatform =
			selectedPlatform === "all" ||
			contest.platform.toLowerCase() === selectedPlatform;
		const matchesSearch = contest.name
			.toLowerCase()
			.includes(searchQuery.toLowerCase());
		return matchesPlatform && matchesSearch;
	});

	// Get unique platforms
	const platforms = [
		"all",
		...new Set(contests.map((c) => c.platform.toLowerCase())),
	];

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
				<div>
					<h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
						<Trophy className="w-8 h-8 text-primary-600 dark:text-primary-400" />
						Upcoming Contests
					</h1>
					<p className="text-gray-600 dark:text-gray-400 mt-1">
						Stay updated with coding contests across all platforms
					</p>
				</div>
				<Button
					onClick={fetchContests}
					disabled={loading}
					variant="outline"
					size="sm"
				>
					<RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
					Refresh
				</Button>
			</div>

			{/* Last Updated */}
			{lastUpdated && (
				<div className="text-sm text-gray-500 dark:text-gray-400">
					Last updated: {new Date(lastUpdated).toLocaleString()}
				</div>
			)}

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
									placeholder="Search contests..."
									value={searchQuery}
									onChange={(e) => setSearchQuery(e.target.value)}
									className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-800 dark:text-white"
								/>
							</div>
						</div>

						{/* Platform Filter */}
						<div className="flex items-center gap-2">
							<Filter className="w-5 h-5 text-gray-400" />
							<select
								value={selectedPlatform}
								onChange={(e) => setSelectedPlatform(e.target.value)}
								className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-800 dark:text-white"
							>
								{platforms.map((platform) => (
									<option key={platform} value={platform}>
										{platform.charAt(0).toUpperCase() + platform.slice(1)}
									</option>
								))}
							</select>
						</div>
					</div>
				</div>
			</div>

			{/* Contests List */}
			{loading ? (
				<LoadingSpinner />
			) : error ? (
				<div className="card border-red-200 dark:border-red-800">
					<div className="card-content text-center py-12">
						<p className="text-red-600 dark:text-red-400">{error}</p>
					</div>
				</div>
			) : filteredContests.length === 0 ? (
				<div className="card">
					<div className="card-content text-center py-12">
						<Trophy className="w-16 h-16 text-gray-400 mx-auto mb-4" />
						<p className="text-gray-600 dark:text-gray-400">No contests found</p>
					</div>
				</div>
			) : (
				<div className="grid gap-4">
					{filteredContests.map((contest) => (
						<div
							key={`${contest.platform}-${contest.id}`}
							className={`card border-l-4 ${getStatusBorderColor(
								contest.startTime
							)} hover:shadow-lg transition-shadow`}
						>
							<div className="card-content">
								<div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
									{/* Contest Info */}
									<div className="flex-1">
										<div className="flex items-center gap-2 mb-2 flex-wrap">
											<Badge
												variant={getPlatformColor(contest.platform)}
												className="uppercase"
											>
												{contest.platform}
											</Badge>
											<Badge variant="outline">{contest.type}</Badge>
										</div>
										<h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
											{contest.name}
										</h3>
										<div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400">
											<div className="flex items-center gap-1">
												<Calendar className="w-4 h-4" />
												<span>{formatDate(contest.startTime)}</span>
											</div>
											<div className="flex items-center gap-1">
												<Clock className="w-4 h-4" />
												<span>{formatTime(contest.startTime)}</span>
											</div>
											<div className="flex items-center gap-1">
												<Clock className="w-4 h-4" />
												<span>Duration: {formatDuration(contest.duration)}</span>
											</div>
										</div>
									</div>

									{/* Time Until Start & Action */}
									<div className="flex flex-col items-end gap-3">
										<div className="text-right">
											<div className="text-sm text-gray-500 dark:text-gray-400">
												Starts
											</div>
											<div className="text-lg font-semibold text-primary-600 dark:text-primary-400">
												{getTimeUntilStart(contest.startTime)}
											</div>
										</div>
										<a
											href={contest.url}
											target="_blank"
											rel="noopener noreferrer"
											className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
										>
											View Contest
											<ExternalLink className="w-4 h-4" />
										</a>
									</div>
								</div>
							</div>
						</div>
					))}
				</div>
			)}

			{/* Stats */}
			{!loading && !error && filteredContests.length > 0 && (
				<div className="card">
					<div className="card-content">
						<div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
							<div>
								<div className="text-2xl font-bold text-primary-600 dark:text-primary-400">
									{filteredContests.length}
								</div>
								<div className="text-sm text-gray-600 dark:text-gray-400">
									Total Contests
								</div>
							</div>
							<div>
								<div className="text-2xl font-bold text-green-600 dark:text-green-400">
									{
										filteredContests.filter(
											(c) => c.startTime - Date.now() / 1000 < 86400
										).length
									}
								</div>
								<div className="text-sm text-gray-600 dark:text-gray-400">
									Starting Soon
								</div>
							</div>
							<div>
								<div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
									{platforms.length - 1}
								</div>
								<div className="text-sm text-gray-600 dark:text-gray-400">
									Platforms
								</div>
							</div>
							<div>
								<div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
									{
										filteredContests.filter(
											(c) => c.startTime - Date.now() / 1000 < 3600
										).length
									}
								</div>
								<div className="text-sm text-gray-600 dark:text-gray-400">
									Starting in 1h
								</div>
							</div>
						</div>
					</div>
				</div>
			)}
		</div>
	);
};

export default Contests;
