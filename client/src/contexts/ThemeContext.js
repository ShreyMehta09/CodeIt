import React, { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "./AuthContext";

const ThemeContext = createContext();

export const useTheme = () => {
	const context = useContext(ThemeContext);
	if (!context) {
		throw new Error("useTheme must be used within a ThemeProvider");
	}
	return context;
};

export const ThemeProvider = ({ children }) => {
	const [theme, setTheme] = useState("light"); // Default to light theme
	const [resolvedTheme, setResolvedTheme] = useState("light");
	const { user } = useAuth();

	// Load theme from user settings or localStorage
	useEffect(() => {
		if (user?.settings?.theme) {
			setTheme(user.settings.theme);
		} else {
			const savedTheme = localStorage.getItem("theme") || "light"; // Default to light
			setTheme(savedTheme);
		}
	}, [user]);

	// Resolve auto theme based on system preference
	useEffect(() => {
		const resolveTheme = () => {
			if (theme === "auto") {
				const prefersDark = window.matchMedia(
					"(prefers-color-scheme: dark)"
				).matches;
				setResolvedTheme(prefersDark ? "dark" : "light");
			} else {
				setResolvedTheme(theme);
			}
		};

		resolveTheme();

		if (theme === "auto") {
			const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
			const handleChange = () => resolveTheme();
			mediaQuery.addEventListener("change", handleChange);
			return () => mediaQuery.removeEventListener("change", handleChange);
		}
	}, [theme]);

	// Apply theme to document
	useEffect(() => {
		document.documentElement.classList.remove("light", "dark");
		document.documentElement.classList.add(resolvedTheme);

		// Update meta theme-color
		const metaThemeColor = document.querySelector('meta[name="theme-color"]');
		if (metaThemeColor) {
			metaThemeColor.setAttribute(
				"content",
				resolvedTheme === "dark" ? "#1f2937" : "#ffffff"
			);
		}
	}, [resolvedTheme]);

	const updateTheme = async (newTheme) => {
		setTheme(newTheme);
		localStorage.setItem("theme", newTheme);

		// Update user preference on server if logged in
		if (user) {
			try {
				const response = await fetch("/api/settings/theme", {
					method: "PUT",
					headers: {
						"Content-Type": "application/json",
						Authorization: `Bearer ${localStorage.getItem("token")}`,
					},
					body: JSON.stringify({ theme: newTheme }),
				});

				if (!response.ok) {
					console.error("Failed to update theme preference on server");
				}
			} catch (error) {
				console.error("Error updating theme preference:", error);
			}
		}
	};

	const value = {
		theme,
		resolvedTheme,
		setTheme: updateTheme,
		isDark: resolvedTheme === "dark",
		isLight: resolvedTheme === "light",
	};

	return (
		<ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
	);
};

export default ThemeContext;
