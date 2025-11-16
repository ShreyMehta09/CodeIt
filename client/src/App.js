import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./contexts/AuthContext";

// Layout Components
import Layout from "./components/Layout/Layout";
import AuthLayout from "./components/Layout/AuthLayout";

// Pages
import Dashboard from "./pages/Dashboard";
import Problems from "./pages/Problems";
import Sheets from "./pages/Sheets";
import SheetDetail from "./pages/SheetDetail";
import Profile from "./pages/Profile";
import PublicProfile from "./pages/PublicProfile";
import Settings from "./pages/Settings";
import Integrations from "./pages/Integrations";
import IntegrationTest from "./pages/IntegrationTest";
import Contests from "./pages/Contests";
import Login from "./pages/Auth/Login";
import Register from "./pages/Auth/Register";
import AuthSuccess from "./pages/Auth/AuthSuccess";
import Landing from "./pages/Landing";

// Admin Pages
import AdminDashboard from "./pages/AdminDashboard";
import AdminSheets from "./pages/AdminSheets";
import AdminProblems from "./pages/AdminProblems";

// Components
import LoadingSpinner from "./components/UI/LoadingSpinner";
import ProtectedRoute from "./components/Auth/ProtectedRoute";
import AdminRoute from "./components/Auth/AdminRoute";

function App() {
	const { user, loading } = useAuth();

	if (loading) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<LoadingSpinner size="lg" />
			</div>
		);
	}

	return (
		<div className="App">
			<Routes>
				{/* Public Routes */}
				<Route
					path="/"
					element={
						user ? (
							user.username === "admin" || user.role === "admin" ? (
								<Navigate to="/admin" replace />
							) : (
								<Navigate to="/dashboard" replace />
							)
						) : (
							<Landing />
						)
					}
				/>
				<Route path="/profile/:username" element={<PublicProfile />} />

				{/* Auth Routes */}
				<Route path="/auth" element={<AuthLayout />}>
					<Route
						path="login"
						element={
							!user ? (
								<Login />
							) : user.username === "admin" || user.role === "admin" ? (
								<Navigate to="/admin" replace />
							) : (
								<Navigate to="/dashboard" replace />
							)
						}
					/>
					<Route
						path="register"
						element={
							!user ? (
								<Register />
							) : user.username === "admin" || user.role === "admin" ? (
								<Navigate to="/admin" replace />
							) : (
								<Navigate to="/dashboard" replace />
							)
						}
					/>
					<Route path="success" element={<AuthSuccess />} />
				</Route>

				{/* Protected Routes */}
				<Route
					path="/"
					element={
						<ProtectedRoute>
							<Layout />
						</ProtectedRoute>
					}
				>
					<Route path="dashboard" element={<Dashboard />} />
					<Route path="problems" element={<Problems />} />
					<Route path="sheets" element={<Sheets />} />
					<Route path="sheets/:id" element={<SheetDetail />} />
					<Route path="contests" element={<Contests />} />
					<Route path="profile" element={<Profile />} />
					<Route path="settings" element={<Settings />} />
					<Route path="integrations" element={<Integrations />} />
					<Route path="integration-test" element={<IntegrationTest />} />
				</Route>

				{/* Admin Routes - Separate protection */}
				<Route
					path="/admin"
					element={
						<ProtectedRoute>
							<AdminRoute>
								<Layout />
							</AdminRoute>
						</ProtectedRoute>
					}
				>
					<Route index element={<AdminDashboard />} />
					<Route path="sheets" element={<AdminSheets />} />
					<Route path="problems" element={<AdminProblems />} />
				</Route>

				{/* 404 Route */}
				<Route
					path="*"
					element={
						<div className="min-h-screen flex items-center justify-center">
							<div className="text-center">
								<h1 className="text-4xl font-bold text-gray-900 mb-4">404</h1>
								<p className="text-gray-600 mb-8">Page not found</p>
								<a href="/" className="btn btn-primary">
									Go Home
								</a>
							</div>
						</div>
					}
				/>
			</Routes>
		</div>
	);
}

export default App;
