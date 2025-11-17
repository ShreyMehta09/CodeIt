const mongoose = require("mongoose");

const moduleProgressSchema = new mongoose.Schema(
	{
		moduleId: {
			type: mongoose.Schema.Types.ObjectId,
			required: true,
		},
		completed: {
			type: Boolean,
			default: false,
		},
		completedAt: {
			type: Date,
		},
		timeSpent: {
			type: Number, // in seconds
			default: 0,
		},
	},
	{ _id: false }
);

const enrollmentSchema = new mongoose.Schema({
	userId: {
		type: mongoose.Schema.Types.ObjectId,
		ref: "User",
		required: true,
	},
	courseId: {
		type: mongoose.Schema.Types.ObjectId,
		ref: "Course",
		required: true,
	},
	// Payment details
	paymentId: {
		type: String,
		required: true,
	},
	orderId: {
		type: String,
		required: true,
	},
	paymentSignature: {
		type: String,
		required: true,
	},
	amountPaid: {
		type: Number,
		required: true,
	},
	currency: {
		type: String,
		default: "INR",
	},
	paymentStatus: {
		type: String,
		enum: ["pending", "completed", "failed", "refunded"],
		default: "completed",
	},
	// Progress tracking
	progress: {
		type: Number,
		default: 0, // percentage
		min: 0,
		max: 100,
	},
	moduleProgress: [moduleProgressSchema],
	completedModules: {
		type: Number,
		default: 0,
	},
	isCompleted: {
		type: Boolean,
		default: false,
	},
	completedAt: {
		type: Date,
	},
	// Access control
	enrolledAt: {
		type: Date,
		default: Date.now,
	},
	expiresAt: {
		type: Date, // null = lifetime access
	},
	isActive: {
		type: Boolean,
		default: true,
	},
	lastAccessedAt: {
		type: Date,
		default: Date.now,
	},
});

// Compound index to ensure user can't enroll in same course twice
enrollmentSchema.index({ userId: 1, courseId: 1 }, { unique: true });

// Update progress percentage
enrollmentSchema.methods.updateProgress = function () {
	const totalModules = this.moduleProgress.length;
	if (totalModules === 0) {
		this.progress = 0;
		return;
	}

	this.completedModules = this.moduleProgress.filter((m) => m.completed).length;
	this.progress = Math.round((this.completedModules / totalModules) * 100);

	if (this.progress === 100 && !this.isCompleted) {
		this.isCompleted = true;
		this.completedAt = new Date();
	}
};

module.exports = mongoose.model("Enrollment", enrollmentSchema);
