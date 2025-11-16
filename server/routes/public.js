const express = require("express");
const router = express.Router();
const User = require("../models/User");
const Sheet = require("../models/Sheet");
const Problem = require("../models/Problem");

// Get public statistics for landing page
router.get("/stats", async (req, res) => {
	try {
		const [totalUsers, totalProblems, totalSheets] = await Promise.all([
			User.countDocuments({}),
			Problem.countDocuments({ isGlobal: true }),
			Sheet.countDocuments({ isGlobal: true }),
		]);

		res.json({
			totalUsers,
			totalProblems,
			totalSheets,
		});
	} catch (error) {
		console.error("Error fetching public stats:", error);
		res.status(500).json({ message: "Server error" });
	}
});

module.exports = router;
