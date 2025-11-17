const express = require("express");
const router = express.Router();
const Course = require("../models/Course");
const Enrollment = require("../models/Enrollment");
const auth = require("../middleware/auth");

// @route   GET /api/courses
// @desc    Get all published courses
// @access  Public
router.get("/", async (req, res) => {
	try {
		const { search, level, minPrice, maxPrice, sort } = req.query;

		let query = { isPublished: true };

		// Search filter
		if (search) {
			query.$or = [
				{ title: { $regex: search, $options: "i" } },
				{ description: { $regex: search, $options: "i" } },
				{ tags: { $in: [new RegExp(search, "i")] } },
			];
		}

		// Level filter
		if (level) {
			query.level = level;
		}

		// Price filter
		if (minPrice !== undefined || maxPrice !== undefined) {
			query.price = {};
			if (minPrice !== undefined) query.price.$gte = Number(minPrice);
			if (maxPrice !== undefined) query.price.$lte = Number(maxPrice);
		}

		// Sort options
		let sortOption = { createdAt: -1 }; // default: newest first
		if (sort === "price_asc") sortOption = { price: 1 };
		if (sort === "price_desc") sortOption = { price: -1 };
		if (sort === "popular") sortOption = { enrolledCount: -1 };
		if (sort === "title") sortOption = { title: 1 };

		const courses = await Course.find(query)
			.select("-modules") // Don't send module content in list view
			.populate("createdBy", "name username")
			.sort(sortOption);

		res.json(courses);
	} catch (error) {
		console.error("Get courses error:", error);
		res.status(500).json({ message: "Server error" });
	}
});

// @route   GET /api/courses/my/enrolled
// @desc    Get user's enrolled courses
// @access  Private
router.get("/my/enrolled", auth, async (req, res) => {
	try {
		const enrollments = await Enrollment.find({
			userId: req.user.id,
			isActive: true,
		})
			.populate({
				path: "courseId",
				populate: { path: "createdBy", select: "name username" },
			})
			.sort({ enrolledAt: -1 });

		res.json(enrollments);
	} catch (error) {
		console.error("Get enrolled courses error:", error);
		res.status(500).json({ message: "Server error" });
	}
});

// @route   GET /api/courses/:id
// @desc    Get single course details
// @access  Public (but modules locked if not enrolled)
router.get("/:id", async (req, res) => {
	try {
		// Get token from header if exists
		const token = req.header("Authorization")?.replace("Bearer ", "");
		let userId = null;

		// If token exists, verify and get user ID
		if (token) {
			try {
				const jwt = require("jsonwebtoken");
				const decoded = jwt.verify(token, process.env.JWT_SECRET);
				userId = decoded.id;
			} catch (err) {
				// Invalid token, continue as unauthenticated
			}
		}

		const course = await Course.findById(req.params.id).populate(
			"createdBy",
			"name username"
		);

		if (!course) {
			return res.status(404).json({ message: "Course not found" });
		}

		// Check if user is enrolled (if authenticated)
		let isEnrolled = false;
		let enrollment = null;

		if (userId) {
			enrollment = await Enrollment.findOne({
				userId: userId,
				courseId: course._id,
			});
			isEnrolled = !!enrollment;
		}

		// If not enrolled, hide module content
		let courseData = course.toObject();
		if (!isEnrolled) {
			courseData.modules = courseData.modules.map((module) => ({
				_id: module._id,
				title: module.title,
				description: module.description,
				order: module.order,
				contentType: module.contentType,
				duration: module.duration,
				locked: true,
			}));
		}

		res.json({
			...courseData,
			isEnrolled,
			enrollment: enrollment
				? {
						progress: enrollment.progress,
						completedModules: enrollment.completedModules,
						enrolledAt: enrollment.enrolledAt,
				  }
				: null,
		});
	} catch (error) {
		console.error("Get course error:", error);
		res.status(500).json({ message: "Server error" });
	}
});

// @route   POST /api/courses/:id/enroll
// @desc    Create Razorpay order for course enrollment
// @access  Private
router.post("/:id/enroll", auth, async (req, res) => {
	try {
		const course = await Course.findById(req.params.id);

		if (!course) {
			return res.status(404).json({ message: "Course not found" });
		}

		if (!course.isPublished) {
			return res
				.status(400)
				.json({ message: "Course is not available for enrollment" });
		}

		// Check if already enrolled
		const existingEnrollment = await Enrollment.findOne({
			userId: req.user.id,
			courseId: course._id,
		});

		if (existingEnrollment) {
			return res
				.status(400)
				.json({ message: "Already enrolled in this course" });
		}

		// Create Razorpay order
		const Razorpay = require("razorpay");
		const razorpay = new Razorpay({
			key_id: process.env.RAZORPAY_KEY_ID,
			key_secret: process.env.RAZORPAY_KEY_SECRET,
		});

		const options = {
			amount: course.price * 100, // amount in smallest currency unit (paise)
			currency: course.currency,
			receipt: `crs_${Date.now().toString().slice(-10)}`, // Max 40 chars, Razorpay limit
		};

		const order = await razorpay.orders.create(options);

		res.json({
			orderId: order.id,
			amount: order.amount,
			currency: order.currency,
			keyId: process.env.RAZORPAY_KEY_ID,
			courseName: course.title,
		});
	} catch (error) {
		console.error("Create order error:", error);
		res.status(500).json({ message: "Failed to create payment order" });
	}
});

// @route   POST /api/courses/:id/verify-payment
// @desc    Verify payment and enroll user
// @access  Private
router.post("/:id/verify-payment", auth, async (req, res) => {
	try {
		const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
			req.body;

		const course = await Course.findById(req.params.id);
		if (!course) {
			return res.status(404).json({ message: "Course not found" });
		}

		// Verify signature
		const crypto = require("crypto");
		const hmac = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET);
		hmac.update(razorpay_order_id + "|" + razorpay_payment_id);
		const generatedSignature = hmac.digest("hex");

		if (generatedSignature !== razorpay_signature) {
			return res.status(400).json({ message: "Payment verification failed" });
		}

		// Create enrollment with module progress
		const moduleProgress = course.modules.map((module) => ({
			moduleId: module._id,
			completed: false,
		}));

		const enrollment = new Enrollment({
			userId: req.user.id,
			courseId: course._id,
			paymentId: razorpay_payment_id,
			orderId: razorpay_order_id,
			paymentSignature: razorpay_signature,
			amountPaid: course.price,
			currency: course.currency,
			paymentStatus: "completed",
			moduleProgress,
		});

		await enrollment.save();

		// Update course enrolled count
		course.enrolledCount += 1;
		await course.save();

		res.json({
			message: "Enrollment successful!",
			enrollment: {
				id: enrollment._id,
				progress: enrollment.progress,
			},
		});
	} catch (error) {
		console.error("Verify payment error:", error);
		res.status(500).json({ message: "Payment verification failed" });
	}
});

// @route   PUT /api/courses/:courseId/modules/:moduleId/progress
// @desc    Update module progress
// @access  Private
router.put("/:courseId/modules/:moduleId/progress", auth, async (req, res) => {
	try {
		const { completed, timeSpent } = req.body;

		const enrollment = await Enrollment.findOne({
			userId: req.user.id,
			courseId: req.params.courseId,
			isActive: true,
		});

		if (!enrollment) {
			return res.status(404).json({ message: "Enrollment not found" });
		}

		// Find and update module progress
		const moduleProgress = enrollment.moduleProgress.find(
			(m) => m.moduleId.toString() === req.params.moduleId
		);

		if (!moduleProgress) {
			return res
				.status(404)
				.json({ message: "Module not found in enrollment" });
		}

		if (completed !== undefined) {
			moduleProgress.completed = completed;
			if (completed) {
				moduleProgress.completedAt = new Date();
			}
		}

		if (timeSpent !== undefined) {
			moduleProgress.timeSpent += timeSpent;
		}

		// Update overall progress
		enrollment.updateProgress();
		enrollment.lastAccessedAt = new Date();

		await enrollment.save();

		res.json({
			message: "Progress updated",
			progress: enrollment.progress,
			completedModules: enrollment.completedModules,
			isCompleted: enrollment.isCompleted,
		});
	} catch (error) {
		console.error("Update progress error:", error);
		res.status(500).json({ message: "Server error" });
	}
});

module.exports = router;
