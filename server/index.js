const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const passport = require("passport");
require("dotenv").config();

// Import routes
const authRoutes = require("./routes/auth");
const otpRoutes = require("./routes/otp");
const userRoutes = require("./routes/users");
const problemRoutes = require("./routes/problems");
const sheetRoutes = require("./routes/sheets");
const integrationRoutes = require("./routes/integrations");
const dashboardRoutes = require("./routes/dashboard");
const settingsRoutes = require("./routes/settings");
const profileRoutes = require("./routes/profile");
const adminRoutes = require("./routes/admin");
const publicRoutes = require("./routes/public");

// Import passport config
require("./config/passport");

// Import background jobs
require("./jobs/syncData");

const app = express();

// Security middleware
app.use(helmet());
app.use(
	cors({
		origin: process.env.CLIENT_URL || "http://localhost:3000",
		credentials: true,
	})
);

// Rate limiting
const limiter = rateLimit({
	windowMs: 15 * 60 * 1000, // 15 minutes
	max: 100, // limit each IP to 100 requests per windowMs
});
app.use("/api/", limiter);

// Body parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Passport middleware
app.use(passport.initialize());

// Request timeout middleware
app.use((req, res, next) => {
	const timeout = 30000; // 30 seconds
	const timer = setTimeout(() => {
		if (!res.headersSent) {
			res.status(408).json({
				message: "Request timeout",
			});
		}
	}, timeout);

	res.on("finish", () => clearTimeout(timer));
	res.on("close", () => clearTimeout(timer));

	next();
});

// Connect to MongoDB with better error handling and options
const mongoUri =
	process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/codolio-clone";

const mongoOptions = {
	maxPoolSize: 10,
	serverSelectionTimeoutMS: 5000,
	socketTimeoutMS: 45000,
	bufferCommands: false,
};

mongoose
	.connect(mongoUri, mongoOptions)
	.then(() => {
		console.log("MongoDB connected successfully");
		console.log(`Connected to: ${mongoUri}`);
	})
	.catch((err) => {
		console.error("MongoDB connection error:", err);
		process.exit(1);
	});

// Handle MongoDB connection events
mongoose.connection.on("error", (err) => {
	console.error("MongoDB error:", err);
});

mongoose.connection.on("disconnected", () => {
	console.log("MongoDB disconnected");
});

mongoose.connection.on("reconnected", () => {
	console.log("MongoDB reconnected");
});

// Graceful shutdown
process.on("SIGINT", async () => {
	console.log("Received SIGINT. Graceful shutdown...");
	try {
		await mongoose.connection.close();
		console.log("MongoDB connection closed.");
		process.exit(0);
	} catch (err) {
		console.error("Error during shutdown:", err);
		process.exit(1);
	}
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/otp", otpRoutes);
app.use("/api/users", userRoutes);
app.use("/api/problems", problemRoutes);
app.use("/api/sheets", sheetRoutes);
app.use("/api/integrations", integrationRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/public", publicRoutes);

// Health check endpoint
app.get("/api/health", (req, res) => {
	res.json({
		status: "OK",
		timestamp: new Date().toISOString(),
		uptime: process.uptime(),
	});
});

// Error handling middleware
app.use((err, req, res, next) => {
	console.error(
		`[${new Date().toISOString()}] Error on ${req.method} ${req.url}:`,
		err.stack
	);

	// Handle specific error types
	if (err.name === "ValidationError") {
		return res.status(400).json({
			message: "Validation Error",
			errors: err.errors,
		});
	}

	if (err.name === "CastError") {
		return res.status(400).json({
			message: "Invalid ID format",
		});
	}

	if (err.code === 11000) {
		return res.status(409).json({
			message: "Duplicate entry",
		});
	}

	if (err.name === "MongooseError") {
		return res.status(503).json({
			message: "Database connection error",
		});
	}

	// Default error
	res.status(err.status || 500).json({
		message: err.message || "Internal server error",
		error: process.env.NODE_ENV === "development" ? err.stack : undefined,
	});
});

// 404 handler
app.use("*", (req, res) => {
	res.status(404).json({ message: "Route not found" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
	console.log(`Server running on port ${PORT}`);
	console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
});
