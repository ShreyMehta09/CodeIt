const mongoose = require("mongoose");

const moduleSchema = new mongoose.Schema(
	{
		title: {
			type: String,
			required: true,
		},
		description: {
			type: String,
			required: true,
		},
		order: {
			type: Number,
			required: true,
		},
		contentType: {
			type: String,
			enum: ["text", "youtube", "problem"],
			required: true,
		},
		content: {
			type: String,
			required: function () {
				// Content is required for text and youtube, optional for problem
				return this.contentType === "text" || this.contentType === "youtube";
			},
		},
		// For problem type - store problem ID reference
		problemId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Problem",
			required: function () {
				return this.contentType === "problem";
			},
		},
		duration: {
			type: Number, // in minutes
			default: 0,
		},
	},
	{ _id: true }
);

const courseSchema = new mongoose.Schema({
	title: {
		type: String,
		required: true,
		trim: true,
	},
	description: {
		type: String,
		required: true,
	},
	instructor: {
		type: String,
		required: true,
		default: "Admin",
	},
	thumbnail: {
		type: String,
		default:
			"https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800",
	},
	price: {
		type: Number,
		required: true,
		default: 0,
	},
	currency: {
		type: String,
		default: "INR",
	},
	modules: [moduleSchema],
	totalModules: {
		type: Number,
		default: 0,
	},
	totalDuration: {
		type: Number, // in minutes
		default: 0,
	},
	level: {
		type: String,
		enum: ["Beginner", "Intermediate", "Advanced"],
		default: "Beginner",
	},
	tags: [
		{
			type: String,
		},
	],
	isPublished: {
		type: Boolean,
		default: false,
	},
	enrolledCount: {
		type: Number,
		default: 0,
	},
	createdBy: {
		type: mongoose.Schema.Types.ObjectId,
		ref: "User",
		required: true,
	},
	createdAt: {
		type: Date,
		default: Date.now,
	},
	updatedAt: {
		type: Date,
		default: Date.now,
	},
});

// Update totalModules and totalDuration before saving
courseSchema.pre("save", function (next) {
	this.totalModules = this.modules.length;
	this.totalDuration = this.modules.reduce(
		(sum, module) => sum + (module.duration || 0),
		0
	);
	this.updatedAt = Date.now();
	next();
});

module.exports = mongoose.model("Course", courseSchema);
