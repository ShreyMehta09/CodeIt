const express = require("express");
const { body, validationResult } = require("express-validator");
const Sheet = require("../models/Sheet");
const Problem = require("../models/Problem");
const auth = require("../middleware/auth");

const router = express.Router();

// @route   GET /api/sheets
// @desc    Get user's sheets
// @access  Private
router.get("/", auth, async (req, res) => {
	try {
		const { page = 1, limit = 20, category, search } = req.query;

		const filter = { userId: req.user.id };

		if (category) filter.category = category;
		if (search) {
			filter.$or = [
				{ name: { $regex: search, $options: "i" } },
				{ description: { $regex: search, $options: "i" } },
			];
		}

		const sheets = await Sheet.find(filter)
			.sort({ updatedAt: -1 })
			.limit(limit * 1)
			.skip((page - 1) * limit);

		const total = await Sheet.countDocuments(filter);

		res.json({
			sheets,
			totalPages: Math.ceil(total / limit),
			currentPage: page,
			total,
		});
	} catch (error) {
		console.error("Get sheets error:", error);
		res.status(500).json({ message: "Server error" });
	}
});

// @route   GET /api/sheets/global
// @desc    Get global sheets (admin/teacher created)
// @access  Private
router.get("/global", auth, async (req, res) => {
	try {
		const { page = 1, limit = 20, category, search } = req.query;

		const filter = { isGlobal: true };

		if (category) filter.category = category;
		if (search) {
			filter.$or = [
				{ name: { $regex: search, $options: "i" } },
				{ description: { $regex: search, $options: "i" } },
			];
		}

		const sheets = await Sheet.find(filter)
			.populate("userId", "name username")
			.sort({ updatedAt: -1 })
			.limit(limit * 1)
			.skip((page - 1) * limit);

		const total = await Sheet.countDocuments(filter);

		res.json({
			sheets,
			totalPages: Math.ceil(total / limit),
			currentPage: page,
			total,
		});
	} catch (error) {
		console.error("Get global sheets error:", error);
		res.status(500).json({ message: "Server error" });
	}
});

// @route   POST /api/sheets
// @desc    Create a new sheet
// @access  Private
router.post(
	"/",
	auth,
	[
		body("name")
			.trim()
			.isLength({ min: 1, max: 100 })
			.withMessage("Name must be between 1 and 100 characters"),
		body("description")
			.optional()
			.isLength({ max: 500 })
			.withMessage("Description must be less than 500 characters"),
		body("category")
			.optional()
			.isIn([
				"dsa",
				"algorithms",
				"data-structures",
				"dynamic-programming",
				"graphs",
				"trees",
				"arrays",
				"strings",
				"math",
				"greedy",
				"backtracking",
				"contest",
				"interview",
				"custom",
			]),
	],
	async (req, res) => {
		try {
			const errors = validationResult(req);
			if (!errors.isEmpty()) {
				return res.status(400).json({ errors: errors.array() });
			}

			const {
				name,
				description,
				category = "custom",
				isPublic = false,
				tags = [],
			} = req.body;

			const sheet = new Sheet({
				name,
				description,
				category,
				isPublic,
				tags: tags.map((tag) => tag.toLowerCase()),
				userId: req.user.id,
			});

			await sheet.save();

			res.status(201).json({
				message: "Sheet created successfully",
				sheet,
			});
		} catch (error) {
			console.error("Create sheet error:", error);
			res.status(500).json({ message: "Server error" });
		}
	}
);

// @route   GET /api/sheets/:id
// @desc    Get sheet details with problems
// @access  Private/Public (based on sheet visibility)
router.get("/:id", auth, async (req, res) => {
	try {
		const { id } = req.params;

		const sheet = await Sheet.findById(id);

		if (!sheet) {
			return res.status(404).json({ message: "Sheet not found" });
		}

		// Check access permissions
		const isOwner = req.user && req.user.id === sheet.userId.toString();
		const isAdmin = req.user && req.user.role === "admin";

		// Allow access if: user is owner, sheet is public, or sheet is global
		const hasAccess = isOwner || sheet.isPublic || sheet.isGlobal;

		// Grant admin owner privileges for global sheets
		const effectiveOwner = isOwner || (isAdmin && sheet.isGlobal);

		if (!hasAccess) {
			console.log("Access denied:", {
				userId: req.user?.id,
				sheetUserId: sheet.userId.toString(),
				isOwner,
				isPublic: sheet.isPublic,
				isGlobal: sheet.isGlobal,
			});
			return res.status(403).json({ message: "Access denied" });
		}

		// Get problems in the sheet
		const problemIds = sheet.problems.map((p) => p.problemId);
		const problems = await Problem.find({
			_id: { $in: problemIds },
		});

		// Merge problems with sheet order and user-specific status
		const orderedProblems = sheet.problems
			.map((sheetProblem) => {
				const problem = problems.find(
					(p) => p._id.toString() === sheetProblem.problemId.toString()
				);
				return {
					...problem?.toObject(),
					addedAt: sheetProblem.addedAt,
					order: sheetProblem.order,
					status: sheetProblem.status || "todo",
					sheetProblemId: sheetProblem._id, // For updating status
				};
			})
			.filter((p) => p._id); // Filter out null problems

		res.json({
			sheet,
			problems: orderedProblems,
			isOwner: effectiveOwner,
		});
	} catch (error) {
		console.error("Get sheet error:", error);
		res.status(500).json({ message: "Server error" });
	}
});

// @route   PUT /api/sheets/:id
// @desc    Update sheet
// @access  Private
router.put(
	"/:id",
	auth,
	[
		body("name")
			.optional()
			.trim()
			.isLength({ min: 1, max: 100 })
			.withMessage("Name must be between 1 and 100 characters"),
		body("description")
			.optional()
			.isLength({ max: 500 })
			.withMessage("Description must be less than 500 characters"),
	],
	async (req, res) => {
		try {
			const errors = validationResult(req);
			if (!errors.isEmpty()) {
				return res.status(400).json({ errors: errors.array() });
			}

			const { id } = req.params;
			const { name, description, category, isPublic, tags } = req.body;

			const sheet = await Sheet.findOne({ _id: id, userId: req.user.id });

			if (!sheet) {
				return res.status(404).json({ message: "Sheet not found" });
			}

			// Update fields
			if (name) sheet.name = name;
			if (description !== undefined) sheet.description = description;
			if (category) sheet.category = category;
			if (isPublic !== undefined) sheet.isPublic = isPublic;
			if (tags) sheet.tags = tags.map((tag) => tag.toLowerCase());

			await sheet.save();

			res.json({
				message: "Sheet updated successfully",
				sheet,
			});
		} catch (error) {
			console.error("Update sheet error:", error);
			res.status(500).json({ message: "Server error" });
		}
	}
);

// @route   DELETE /api/sheets/:id
// @desc    Delete sheet
// @access  Private
router.delete("/:id", auth, async (req, res) => {
	try {
		const { id } = req.params;

		const sheet = await Sheet.findOneAndDelete({
			_id: id,
			userId: req.user.id,
		});

		if (!sheet) {
			return res.status(404).json({ message: "Sheet not found" });
		}

		res.json({ message: "Sheet deleted successfully" });
	} catch (error) {
		console.error("Delete sheet error:", error);
		res.status(500).json({ message: "Server error" });
	}
});

// @route   POST /api/sheets/:id/problems
// @desc    Add problem to sheet
// @access  Private
router.post(
	"/:id/problems",
	auth,
	[body("problemId").isMongoId().withMessage("Valid problem ID is required")],
	async (req, res) => {
		try {
			const errors = validationResult(req);
			if (!errors.isEmpty()) {
				return res.status(400).json({ errors: errors.array() });
			}

			const { id } = req.params;
			const { problemId } = req.body;

			const sheet = await Sheet.findOne({ _id: id, userId: req.user.id });

			if (!sheet) {
				return res.status(404).json({ message: "Sheet not found" });
			}

			// Check if problem exists and belongs to user
			const problem = await Problem.findOne({
				_id: problemId,
				userId: req.user.id,
			});
			if (!problem) {
				return res.status(404).json({ message: "Problem not found" });
			}

			// Check if problem is already in sheet
			const existingProblem = sheet.problems.find(
				(p) => p.problemId.toString() === problemId
			);
			if (existingProblem) {
				return res
					.status(400)
					.json({ message: "Problem already exists in this sheet" });
			}

			// Add problem to sheet
			sheet.problems.push({
				problemId,
				order: sheet.problems.length,
			});

			await sheet.save();
			await sheet.updateProgress();

			res.json({
				message: "Problem added to sheet successfully",
				sheet,
			});
		} catch (error) {
			console.error("Add problem to sheet error:", error);
			res.status(500).json({ message: "Server error" });
		}
	}
);

// @route   DELETE /api/sheets/:id/problems/:problemId
// @desc    Remove problem from sheet
// @access  Private
router.delete("/:id/problems/:problemId", auth, async (req, res) => {
	try {
		const { id, problemId } = req.params;

		const sheet = await Sheet.findOne({ _id: id, userId: req.user.id });

		if (!sheet) {
			return res.status(404).json({ message: "Sheet not found" });
		}

		// Remove problem from sheet
		sheet.problems = sheet.problems.filter(
			(p) => p.problemId.toString() !== problemId
		);

		await sheet.save();
		await sheet.updateProgress();

		res.json({
			message: "Problem removed from sheet successfully",
			sheet,
		});
	} catch (error) {
		console.error("Remove problem from sheet error:", error);
		res.status(500).json({ message: "Server error" });
	}
});

// @route   PUT /api/sheets/:id/reorder
// @desc    Reorder problems in sheet
// @access  Private
router.put(
	"/:id/reorder",
	auth,
	[body("problemIds").isArray().withMessage("Problem IDs array is required")],
	async (req, res) => {
		try {
			const errors = validationResult(req);
			if (!errors.isEmpty()) {
				return res.status(400).json({ errors: errors.array() });
			}

			const { id } = req.params;
			const { problemIds } = req.body;

			const sheet = await Sheet.findOne({ _id: id, userId: req.user.id });

			if (!sheet) {
				return res.status(404).json({ message: "Sheet not found" });
			}

			// Update order
			sheet.problems = problemIds.map((problemId, index) => {
				const existingProblem = sheet.problems.find(
					(p) => p.problemId.toString() === problemId
				);
				return {
					problemId,
					addedAt: existingProblem?.addedAt || new Date(),
					order: index,
				};
			});

			await sheet.save();

			res.json({
				message: "Sheet reordered successfully",
				sheet,
			});
		} catch (error) {
			console.error("Reorder sheet error:", error);
			res.status(500).json({ message: "Server error" });
		}
	}
);

// @route   GET /api/sheets/public/templates
// @desc    Get template sheets
// @access  Public
router.get("/public/templates", async (req, res) => {
	try {
		const templates = await Sheet.getTemplates();
		res.json(templates);
	} catch (error) {
		console.error("Get templates error:", error);
		res.status(500).json({ message: "Server error" });
	}
});

// @route   POST /api/sheets/fork/:shareCode
// @desc    Fork a public sheet
// @access  Private
router.post("/fork/:shareCode", auth, async (req, res) => {
	try {
		const { shareCode } = req.params;

		const originalSheet = await Sheet.findOne({ shareCode, isPublic: true });

		if (!originalSheet) {
			return res.status(404).json({ message: "Sheet not found or not public" });
		}

		// Create forked sheet
		const forkedSheet = new Sheet({
			name: `${originalSheet.name} (Fork)`,
			description: originalSheet.description,
			category: originalSheet.category,
			tags: [...originalSheet.tags],
			problems: [...originalSheet.problems],
			userId: req.user.id,
			isPublic: false,
		});

		await forkedSheet.save();
		await forkedSheet.updateProgress();

		// Update original sheet stats
		originalSheet.stats.forks += 1;
		await originalSheet.save();

		res.status(201).json({
			message: "Sheet forked successfully",
			sheet: forkedSheet,
		});
	} catch (error) {
		console.error("Fork sheet error:", error);
		res.status(500).json({ message: "Server error" });
	}
});

// @route   GET /api/sheets/public/:shareCode
// @desc    Get public sheet by share code
// @access  Public
router.get("/public/:shareCode", async (req, res) => {
	try {
		const { shareCode } = req.params;

		const sheet = await Sheet.findOne({ shareCode, isPublic: true });

		if (!sheet) {
			return res.status(404).json({ message: "Sheet not found or not public" });
		}

		// Increment view count
		sheet.stats.views += 1;
		await sheet.save();

		// Get problems in the sheet
		const problemIds = sheet.problems.map((p) => p.problemId);
		const problems = await Problem.find({
			_id: { $in: problemIds },
			userId: sheet.userId,
		});

		// Merge problems with sheet order
		const orderedProblems = sheet.problems
			.map((sheetProblem) => {
				const problem = problems.find(
					(p) => p._id.toString() === sheetProblem.problemId.toString()
				);
				return {
					...problem?.toObject(),
					addedAt: sheetProblem.addedAt,
					order: sheetProblem.order,
				};
			})
			.filter((p) => p._id);

		res.json({
			sheet,
			problems: orderedProblems,
		});
	} catch (error) {
		console.error("Get public sheet error:", error);
		res.status(500).json({ message: "Server error" });
	}
});

// @route   POST /api/sheets/:id/add-to-my-sheets
// @desc    Add admin/global sheet to user's collection
// @access  Private
router.post("/:id/add-to-my-sheets", auth, async (req, res) => {
	try {
		const { id } = req.params;

		const globalSheet = await Sheet.findOne({ _id: id, isGlobal: true });

		if (!globalSheet) {
			return res.status(404).json({ message: "Global sheet not found" });
		}

		// Check if user already has this sheet
		const existingSheet = await Sheet.findOne({
			userId: req.user.id,
			name: globalSheet.name,
			"problems.problemId": {
				$in: globalSheet.problems.map((p) => p.problemId),
			},
		});

		if (existingSheet) {
			return res
				.status(400)
				.json({ message: "You already have this sheet in your collection" });
		}

		// Create a copy for the user
		const userSheet = new Sheet({
			name: globalSheet.name,
			description: globalSheet.description,
			category: globalSheet.category,
			tags: [...globalSheet.tags],
			problems: [...globalSheet.problems],
			userId: req.user.id,
			isPublic: false,
			totalProblems: globalSheet.totalProblems,
			difficultyDistribution: globalSheet.difficultyDistribution,
		});

		await userSheet.save();

		res.status(201).json({
			message: "Sheet added to your collection successfully",
			sheet: userSheet,
		});
	} catch (error) {
		console.error("Add to my sheets error:", error);
		res.status(500).json({ message: "Server error" });
	}
});

// @route   POST /api/sheets/:id/add-problem
// @desc    Add a problem to sheet by problem details (manual entry)
// @access  Private
router.post(
	"/:id/add-problem",
	auth,
	[
		body("title").trim().notEmpty().withMessage("Problem title is required"),
		body("difficulty")
			.isIn(["easy", "medium", "hard"])
			.withMessage("Valid difficulty is required"),
		body("link").optional().isURL().withMessage("Valid URL is required"),
		body("platform")
			.optional()
			.isIn(["leetcode", "codeforces", "codechef", "atcoder", "custom"]),
	],
	async (req, res) => {
		try {
			const errors = validationResult(req);
			if (!errors.isEmpty()) {
				return res.status(400).json({ errors: errors.array() });
			}

			const { id } = req.params;
			const { title, difficulty, link, tags, notes, platform } = req.body;

			const sheet = await Sheet.findById(id);

			if (!sheet) {
				return res.status(404).json({ message: "Sheet not found" });
			}

			// Check if user has permission to add problems
			const isOwner = req.user.id === sheet.userId.toString();
			const isAdmin = req.user.role === "admin";
			const canAddProblem = isOwner || (isAdmin && sheet.isGlobal);

			if (!canAddProblem) {
				return res.status(403).json({
					message: "You don't have permission to add problems to this sheet",
				});
			}

			// Generate a unique problemId (use title-based slug or random string)
			const problemId =
				title.toLowerCase().replace(/[^a-z0-9]+/g, "-") + "-" + Date.now();

			// Use provided link or generate a placeholder
			const problemUrl = link || `https://custom-problem/${problemId}`;

			// Use provided platform or default to custom
			const problemPlatform = platform || "custom";

			// Create a new problem
			const problem = new Problem({
				title,
				difficulty,
				url: problemUrl,
				problemId: problemId,
				platform: problemPlatform,
				tags: tags || [],
				notes,
				userId: req.user.id,
				status: "todo",
			});

			await problem.save();

			// Add problem to sheet
			sheet.problems.push({
				problemId: problem._id,
				order: sheet.problems.length,
			});

			await sheet.save();
			await sheet.updateProgress();

			res.json({
				message: "Problem added to sheet successfully",
				sheet,
				problem,
			});
		} catch (error) {
			console.error("Add problem to sheet error:", error);
			res.status(500).json({ message: "Server error" });
		}
	}
);

// @route   POST /api/sheets/:id/request-approval
// @desc    Request admin approval to make sheet global
// @access  Private
router.post("/:id/request-approval", auth, async (req, res) => {
	try {
		const { id } = req.params;

		const sheet = await Sheet.findOne({ _id: id, userId: req.user.id });

		if (!sheet) {
			return res.status(404).json({ message: "Sheet not found" });
		}

		if (sheet.approvalStatus === "pending") {
			return res
				.status(400)
				.json({ message: "Approval request already pending" });
		}

		if (sheet.approvalStatus === "approved") {
			return res.status(400).json({ message: "Sheet is already approved" });
		}

		if (sheet.problems.length === 0) {
			return res
				.status(400)
				.json({ message: "Cannot request approval for empty sheet" });
		}

		sheet.approvalStatus = "pending";
		sheet.approvalRequestedAt = new Date();
		sheet.isPublic = true; // Mark as public when requesting approval

		await sheet.save();

		res.json({
			message: "Approval request submitted successfully",
			sheet,
		});
	} catch (error) {
		console.error("Request approval error:", error);
		res.status(500).json({ message: "Server error" });
	}
});

// @route   GET /api/sheets/admin/pending-approvals
// @desc    Get sheets pending approval (Admin only)
// @access  Private (Admin)
router.get("/admin/pending-approvals", auth, async (req, res) => {
	try {
		// Check if user is admin
		const User = require("../models/User");
		const user = await User.findById(req.user.id);

		if (!user || user.role !== "admin") {
			return res.status(403).json({ message: "Admin access required" });
		}

		const pendingSheets = await Sheet.find({ approvalStatus: "pending" })
			.populate("userId", "name username email")
			.sort({ approvalRequestedAt: -1 });

		res.json({
			sheets: pendingSheets,
			total: pendingSheets.length,
		});
	} catch (error) {
		console.error("Get pending approvals error:", error);
		res.status(500).json({ message: "Server error" });
	}
});

// @route   POST /api/sheets/:id/approve
// @desc    Approve sheet and make it global (Admin only)
// @access  Private (Admin)
router.post("/:id/approve", auth, async (req, res) => {
	try {
		// Check if user is admin
		const User = require("../models/User");
		const user = await User.findById(req.user.id);

		if (!user || user.role !== "admin") {
			return res.status(403).json({ message: "Admin access required" });
		}

		const { id } = req.params;
		const sheet = await Sheet.findById(id);

		if (!sheet) {
			return res.status(404).json({ message: "Sheet not found" });
		}

		if (sheet.approvalStatus !== "pending") {
			return res.status(400).json({ message: "Sheet is not pending approval" });
		}

		sheet.approvalStatus = "approved";
		sheet.approvedBy = req.user.id;
		sheet.approvedAt = new Date();
		sheet.isGlobal = true;
		sheet.isPublic = true;

		await sheet.save();

		res.json({
			message: "Sheet approved and made global successfully",
			sheet,
		});
	} catch (error) {
		console.error("Approve sheet error:", error);
		res.status(500).json({ message: "Server error" });
	}
});

// @route   POST /api/sheets/:id/reject
// @desc    Reject sheet approval request (Admin only)
// @access  Private (Admin)
router.post(
	"/:id/reject",
	auth,
	[
		body("reason")
			.trim()
			.notEmpty()
			.withMessage("Rejection reason is required"),
	],
	async (req, res) => {
		try {
			const errors = validationResult(req);
			if (!errors.isEmpty()) {
				return res.status(400).json({ errors: errors.array() });
			}

			// Check if user is admin
			const User = require("../models/User");
			const user = await User.findById(req.user.id);

			if (!user || user.role !== "admin") {
				return res.status(403).json({ message: "Admin access required" });
			}

			const { id } = req.params;
			const { reason } = req.body;

			const sheet = await Sheet.findById(id);

			if (!sheet) {
				return res.status(404).json({ message: "Sheet not found" });
			}

			if (sheet.approvalStatus !== "pending") {
				return res
					.status(400)
					.json({ message: "Sheet is not pending approval" });
			}

			sheet.approvalStatus = "rejected";
			sheet.rejectionReason = reason;
			sheet.isPublic = false;
			sheet.isGlobal = false;

			await sheet.save();

			res.json({
				message: "Sheet approval rejected",
				sheet,
			});
		} catch (error) {
			console.error("Reject sheet error:", error);
			res.status(500).json({ message: "Server error" });
		}
	}
);

// @route   PATCH /api/sheets/:id/problems/:problemId/status
// @desc    Update problem status in a sheet (user-specific)
// @access  Private
router.patch(
	"/:id/problems/:problemId/status",
	auth,
	[
		body("status")
			.isIn(["todo", "attempted", "solved", "review"])
			.withMessage("Invalid status"),
	],
	async (req, res) => {
		try {
			const errors = validationResult(req);
			if (!errors.isEmpty()) {
				return res.status(400).json({ errors: errors.array() });
			}

			const { id, problemId } = req.params;
			const { status } = req.body;

			const sheet = await Sheet.findById(id);

			if (!sheet) {
				return res.status(404).json({ message: "Sheet not found" });
			}

			// Check if user is owner
			const isOwner = req.user && req.user.id === sheet.userId.toString();

			if (!isOwner) {
				return res.status(403).json({ message: "Access denied" });
			}

			// Find the problem in the sheet
			const problemIndex = sheet.problems.findIndex(
				(p) => p.problemId.toString() === problemId
			);

			if (problemIndex === -1) {
				return res.status(404).json({ message: "Problem not found in sheet" });
			}

			// Update the status
			sheet.problems[problemIndex].status = status;

			// Update progress
			await sheet.updateProgress();

			res.json({
				message: "Problem status updated",
				sheet,
			});
		} catch (error) {
			console.error("Update problem status error:", error);
			res.status(500).json({ message: "Server error" });
		}
	}
);

module.exports = router;
