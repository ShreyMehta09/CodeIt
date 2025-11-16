require("dotenv").config({ path: "../.env" });
const mongoose = require("mongoose");
const Sheet = require("../models/Sheet");
const Problem = require("../models/Problem");
const User = require("../models/User");

const sheetsData = [
	{
		name: "Striver's A2Z DSA Sheet",
		description:
			"Complete roadmap to learn Data Structures and Algorithms from A to Z. This comprehensive sheet covers all important DSA topics with carefully curated problems from basic to advanced level.",
		category: "dsa",
		tags: ["striver", "a2z", "dsa", "complete-roadmap", "interview-prep"],
		problems: [
			// Arrays
			{
				title: "Largest Element in Array",
				platform: "leetcode",
				problemId: "largest-element",
				url: "https://practice.geeksforgeeks.org/problems/largest-element-in-array",
				difficulty: "easy",
				tags: ["array", "basics"],
			},
			{
				title: "Second Largest Element",
				platform: "leetcode",
				problemId: "second-largest",
				url: "https://practice.geeksforgeeks.org/problems/second-largest",
				difficulty: "easy",
				tags: ["array", "basics"],
			},
			{
				title: "Check if Array is Sorted",
				platform: "leetcode",
				problemId: "check-sorted",
				url: "https://practice.geeksforgeeks.org/problems/check-if-array-is-sorted",
				difficulty: "easy",
				tags: ["array", "basics"],
			},
			{
				title: "Remove Duplicates from Sorted Array",
				platform: "leetcode",
				problemId: "26",
				url: "https://leetcode.com/problems/remove-duplicates-from-sorted-array/",
				difficulty: "easy",
				tags: ["array", "two-pointers"],
			},
			{
				title: "Rotate Array",
				platform: "leetcode",
				problemId: "189",
				url: "https://leetcode.com/problems/rotate-array/",
				difficulty: "medium",
				tags: ["array", "math"],
			},
			{
				title: "Move Zeroes",
				platform: "leetcode",
				problemId: "283",
				url: "https://leetcode.com/problems/move-zeroes/",
				difficulty: "easy",
				tags: ["array", "two-pointers"],
			},
			{
				title: "Linear Search",
				platform: "custom",
				problemId: "linear-search",
				url: "https://practice.geeksforgeeks.org/problems/search-an-element-in-an-array",
				difficulty: "easy",
				tags: ["array", "searching"],
			},
			{
				title: "Union of Two Sorted Arrays",
				platform: "custom",
				problemId: "union-arrays",
				url: "https://practice.geeksforgeeks.org/problems/union-of-two-sorted-arrays",
				difficulty: "easy",
				tags: ["array", "two-pointers"],
			},
			{
				title: "Missing Number",
				platform: "leetcode",
				problemId: "268",
				url: "https://leetcode.com/problems/missing-number/",
				difficulty: "easy",
				tags: ["array", "math", "bit-manipulation"],
			},
			{
				title: "Max Consecutive Ones",
				platform: "leetcode",
				problemId: "485",
				url: "https://leetcode.com/problems/max-consecutive-ones/",
				difficulty: "easy",
				tags: ["array"],
			},
			{
				title: "Single Number",
				platform: "leetcode",
				problemId: "136",
				url: "https://leetcode.com/problems/single-number/",
				difficulty: "easy",
				tags: ["array", "bit-manipulation"],
			},
			{
				title: "Longest Subarray with Sum K",
				platform: "custom",
				problemId: "longest-subarray",
				url: "https://practice.geeksforgeeks.org/problems/longest-sub-array-with-sum-k",
				difficulty: "medium",
				tags: ["array", "hash-table", "sliding-window"],
			},
			{
				title: "Two Sum",
				platform: "leetcode",
				problemId: "1",
				url: "https://leetcode.com/problems/two-sum/",
				difficulty: "easy",
				tags: ["array", "hash-table"],
			},
			{
				title: "Sort Colors",
				platform: "leetcode",
				problemId: "75",
				url: "https://leetcode.com/problems/sort-colors/",
				difficulty: "medium",
				tags: ["array", "two-pointers", "sorting"],
			},
			{
				title: "Majority Element",
				platform: "leetcode",
				problemId: "169",
				url: "https://leetcode.com/problems/majority-element/",
				difficulty: "easy",
				tags: ["array", "hash-table"],
			},
			{
				title: "Maximum Subarray",
				platform: "leetcode",
				problemId: "53",
				url: "https://leetcode.com/problems/maximum-subarray/",
				difficulty: "medium",
				tags: ["array", "divide-and-conquer", "dynamic-programming"],
			},
			{
				title: "Best Time to Buy and Sell Stock",
				platform: "leetcode",
				problemId: "121",
				url: "https://leetcode.com/problems/best-time-to-buy-and-sell-stock/",
				difficulty: "easy",
				tags: ["array", "dynamic-programming"],
			},
			{
				title: "Rearrange Array Elements by Sign",
				platform: "leetcode",
				problemId: "2149",
				url: "https://leetcode.com/problems/rearrange-array-elements-by-sign/",
				difficulty: "medium",
				tags: ["array", "two-pointers"],
			},
			{
				title: "Next Permutation",
				platform: "leetcode",
				problemId: "31",
				url: "https://leetcode.com/problems/next-permutation/",
				difficulty: "medium",
				tags: ["array", "two-pointers"],
			},
			{
				title: "Leaders in an Array",
				platform: "custom",
				problemId: "leaders-array",
				url: "https://practice.geeksforgeeks.org/problems/leaders-in-an-array",
				difficulty: "easy",
				tags: ["array"],
			},
		],
	},
	{
		name: "Arsh DSA Sheet (45-60 Days Plan)",
		description:
			"Curated list of 280+ problems for cracking product-based company interviews. Created by Arsh Goyal, this sheet focuses on frequently asked interview questions with a structured 45-60 day learning plan.",
		category: "interview",
		tags: ["arsh", "dsa", "interview-prep", "product-companies", "45-days"],
		problems: [
			// Day 1-5: Arrays
			{
				title: "Set Matrix Zeroes",
				platform: "leetcode",
				problemId: "73",
				url: "https://leetcode.com/problems/set-matrix-zeroes/",
				difficulty: "medium",
				tags: ["array", "hash-table", "matrix"],
			},
			{
				title: "Move Zeroes",
				platform: "leetcode",
				problemId: "283",
				url: "https://leetcode.com/problems/move-zeroes/",
				difficulty: "easy",
				tags: ["array", "two-pointers"],
			},
			{
				title: "Best Time to Buy and Sell Stock",
				platform: "leetcode",
				problemId: "121",
				url: "https://leetcode.com/problems/best-time-to-buy-and-sell-stock/",
				difficulty: "easy",
				tags: ["array", "dynamic-programming"],
			},
			{
				title: "Chocolate Distribution Problem",
				platform: "custom",
				problemId: "chocolate-distribution",
				url: "https://practice.geeksforgeeks.org/problems/chocolate-distribution-problem",
				difficulty: "easy",
				tags: ["array", "sorting"],
			},
			{
				title: "Two Sum",
				platform: "leetcode",
				problemId: "1",
				url: "https://leetcode.com/problems/two-sum/",
				difficulty: "easy",
				tags: ["array", "hash-table"],
			},
			{
				title: "Best Time to Buy and Sell Stock II",
				platform: "leetcode",
				problemId: "122",
				url: "https://leetcode.com/problems/best-time-to-buy-and-sell-stock-ii/",
				difficulty: "medium",
				tags: ["array", "dynamic-programming", "greedy"],
			},
			{
				title: "Subarray Sum Equals K",
				platform: "leetcode",
				problemId: "560",
				url: "https://leetcode.com/problems/subarray-sum-equals-k/",
				difficulty: "medium",
				tags: ["array", "hash-table", "prefix-sum"],
			},
			{
				title: "Spiral Matrix",
				platform: "leetcode",
				problemId: "54",
				url: "https://leetcode.com/problems/spiral-matrix/",
				difficulty: "medium",
				tags: ["array", "matrix", "simulation"],
			},
			{
				title: "Word Search",
				platform: "leetcode",
				problemId: "79",
				url: "https://leetcode.com/problems/word-search/",
				difficulty: "medium",
				tags: ["array", "backtracking", "matrix"],
			},
			{
				title: "3Sum",
				platform: "leetcode",
				problemId: "15",
				url: "https://leetcode.com/problems/3sum/",
				difficulty: "medium",
				tags: ["array", "two-pointers", "sorting"],
			},
			{
				title: "4Sum",
				platform: "leetcode",
				problemId: "18",
				url: "https://leetcode.com/problems/4sum/",
				difficulty: "medium",
				tags: ["array", "two-pointers", "sorting"],
			},
			{
				title: "Maximum Points You Can Obtain from Cards",
				platform: "leetcode",
				problemId: "1423",
				url: "https://leetcode.com/problems/maximum-points-you-can-obtain-from-cards/",
				difficulty: "medium",
				tags: ["array", "sliding-window", "prefix-sum"],
			},
			// Day 6-10: Strings
			{
				title: "Valid Parentheses",
				platform: "leetcode",
				problemId: "20",
				url: "https://leetcode.com/problems/valid-parentheses/",
				difficulty: "easy",
				tags: ["string", "stack"],
			},
			{
				title: "Longest Common Prefix",
				platform: "leetcode",
				problemId: "14",
				url: "https://leetcode.com/problems/longest-common-prefix/",
				difficulty: "easy",
				tags: ["string"],
			},
			{
				title: "Valid Palindrome II",
				platform: "leetcode",
				problemId: "680",
				url: "https://leetcode.com/problems/valid-palindrome-ii/",
				difficulty: "easy",
				tags: ["string", "two-pointers", "greedy"],
			},
			{
				title: "Integer to Roman",
				platform: "leetcode",
				problemId: "12",
				url: "https://leetcode.com/problems/integer-to-roman/",
				difficulty: "medium",
				tags: ["hash-table", "math", "string"],
			},
			{
				title: "Generate Parentheses",
				platform: "leetcode",
				problemId: "22",
				url: "https://leetcode.com/problems/generate-parentheses/",
				difficulty: "medium",
				tags: ["string", "dynamic-programming", "backtracking"],
			},
			{
				title: "Simplify Path",
				platform: "leetcode",
				problemId: "71",
				url: "https://leetcode.com/problems/simplify-path/",
				difficulty: "medium",
				tags: ["string", "stack"],
			},
			// Linked Lists
			{
				title: "Reverse Linked List",
				platform: "leetcode",
				problemId: "206",
				url: "https://leetcode.com/problems/reverse-linked-list/",
				difficulty: "easy",
				tags: ["linked-list", "recursion"],
			},
			{
				title: "Middle of the Linked List",
				platform: "leetcode",
				problemId: "876",
				url: "https://leetcode.com/problems/middle-of-the-linked-list/",
				difficulty: "easy",
				tags: ["linked-list", "two-pointers"],
			},
			{
				title: "Merge Two Sorted Lists",
				platform: "leetcode",
				problemId: "21",
				url: "https://leetcode.com/problems/merge-two-sorted-lists/",
				difficulty: "easy",
				tags: ["linked-list", "recursion"],
			},
			{
				title: "Remove Nth Node From End of List",
				platform: "leetcode",
				problemId: "19",
				url: "https://leetcode.com/problems/remove-nth-node-from-end-of-list/",
				difficulty: "medium",
				tags: ["linked-list", "two-pointers"],
			},
		],
	},
	{
		name: "Apna College DSA Sheet",
		description:
			"Complete Data Structures and Algorithms practice sheet designed for beginners to advanced learners. Covers all fundamental concepts with problems organized by topic and difficulty level.",
		category: "dsa",
		tags: [
			"apna-college",
			"dsa",
			"beginner-friendly",
			"complete-course",
			"structured-learning",
		],
		problems: [
			// Arrays & Strings
			{
				title: "Reverse Array",
				platform: "custom",
				problemId: "reverse-array",
				url: "https://practice.geeksforgeeks.org/problems/reverse-an-array",
				difficulty: "easy",
				tags: ["array", "two-pointers"],
			},
			{
				title: "Maximum and Minimum Element in Array",
				platform: "custom",
				problemId: "max-min-array",
				url: "https://practice.geeksforgeeks.org/problems/max-min",
				difficulty: "easy",
				tags: ["array"],
			},
			{
				title: "Kth Smallest Element",
				platform: "leetcode",
				problemId: "215",
				url: "https://leetcode.com/problems/kth-largest-element-in-an-array/",
				difficulty: "medium",
				tags: ["array", "divide-and-conquer", "sorting", "heap"],
			},
			{
				title: "Sort 0s, 1s and 2s",
				platform: "leetcode",
				problemId: "75",
				url: "https://leetcode.com/problems/sort-colors/",
				difficulty: "medium",
				tags: ["array", "two-pointers", "sorting"],
			},
			{
				title: "Move Negative Numbers to Beginning",
				platform: "custom",
				problemId: "move-negative",
				url: "https://practice.geeksforgeeks.org/problems/move-all-negative-elements-to-end",
				difficulty: "easy",
				tags: ["array", "two-pointers"],
			},
			{
				title: "Union and Intersection of Arrays",
				platform: "custom",
				problemId: "union-intersection",
				url: "https://practice.geeksforgeeks.org/problems/union-of-two-arrays",
				difficulty: "easy",
				tags: ["array", "hash-table"],
			},
			{
				title: "Cyclically Rotate Array by One",
				platform: "custom",
				problemId: "rotate-one",
				url: "https://practice.geeksforgeeks.org/problems/cyclically-rotate-an-array-by-one",
				difficulty: "easy",
				tags: ["array"],
			},
			{
				title: "Kadane's Algorithm",
				platform: "leetcode",
				problemId: "53",
				url: "https://leetcode.com/problems/maximum-subarray/",
				difficulty: "medium",
				tags: ["array", "divide-and-conquer", "dynamic-programming"],
			},
			{
				title: "Minimize the Heights",
				platform: "custom",
				problemId: "minimize-heights",
				url: "https://practice.geeksforgeeks.org/problems/minimize-the-heights",
				difficulty: "medium",
				tags: ["array", "greedy"],
			},
			{
				title: "Minimum Number of Jumps",
				platform: "custom",
				problemId: "min-jumps",
				url: "https://practice.geeksforgeeks.org/problems/minimum-number-of-jumps",
				difficulty: "medium",
				tags: ["array", "dynamic-programming", "greedy"],
			},
			// Matrix
			{
				title: "Rotate Image",
				platform: "leetcode",
				problemId: "48",
				url: "https://leetcode.com/problems/rotate-image/",
				difficulty: "medium",
				tags: ["array", "math", "matrix"],
			},
			{
				title: "Search a 2D Matrix",
				platform: "leetcode",
				problemId: "74",
				url: "https://leetcode.com/problems/search-a-2d-matrix/",
				difficulty: "medium",
				tags: ["array", "binary-search", "matrix"],
			},
			{
				title: "Median in a Row-Wise Sorted Matrix",
				platform: "custom",
				problemId: "median-matrix",
				url: "https://practice.geeksforgeeks.org/problems/median-in-a-row-wise-sorted-matrix",
				difficulty: "medium",
				tags: ["array", "binary-search", "matrix"],
			},
			// Strings
			{
				title: "Reverse String",
				platform: "leetcode",
				problemId: "344",
				url: "https://leetcode.com/problems/reverse-string/",
				difficulty: "easy",
				tags: ["string", "two-pointers"],
			},
			{
				title: "Check Palindrome",
				platform: "leetcode",
				problemId: "125",
				url: "https://leetcode.com/problems/valid-palindrome/",
				difficulty: "easy",
				tags: ["string", "two-pointers"],
			},
			{
				title: "Print All Duplicates in String",
				platform: "custom",
				problemId: "print-duplicates",
				url: "https://practice.geeksforgeeks.org/problems/print-all-duplicate-characters",
				difficulty: "easy",
				tags: ["string", "hash-table"],
			},
			{
				title: "Longest Palindrome in String",
				platform: "leetcode",
				problemId: "5",
				url: "https://leetcode.com/problems/longest-palindromic-substring/",
				difficulty: "medium",
				tags: ["string", "dynamic-programming"],
			},
			{
				title: "Longest Repeating Character Replacement",
				platform: "leetcode",
				problemId: "424",
				url: "https://leetcode.com/problems/longest-repeating-character-replacement/",
				difficulty: "medium",
				tags: ["string", "sliding-window"],
			},
			// Searching & Sorting
			{
				title: "Binary Search",
				platform: "leetcode",
				problemId: "704",
				url: "https://leetcode.com/problems/binary-search/",
				difficulty: "easy",
				tags: ["array", "binary-search"],
			},
			{
				title: "Find First and Last Position in Sorted Array",
				platform: "leetcode",
				problemId: "34",
				url: "https://leetcode.com/problems/find-first-and-last-position-of-element-in-sorted-array/",
				difficulty: "medium",
				tags: ["array", "binary-search"],
			},
			{
				title: "Search in Rotated Sorted Array",
				platform: "leetcode",
				problemId: "33",
				url: "https://leetcode.com/problems/search-in-rotated-sorted-array/",
				difficulty: "medium",
				tags: ["array", "binary-search"],
			},
			{
				title: "Find Peak Element",
				platform: "leetcode",
				problemId: "162",
				url: "https://leetcode.com/problems/find-peak-element/",
				difficulty: "medium",
				tags: ["array", "binary-search"],
			},
			// Linked List
			{
				title: "Reverse a Linked List",
				platform: "leetcode",
				problemId: "206",
				url: "https://leetcode.com/problems/reverse-linked-list/",
				difficulty: "easy",
				tags: ["linked-list", "recursion"],
			},
			{
				title: "Detect Loop in Linked List",
				platform: "leetcode",
				problemId: "141",
				url: "https://leetcode.com/problems/linked-list-cycle/",
				difficulty: "easy",
				tags: ["linked-list", "two-pointers"],
			},
			{
				title: "Remove Loop in Linked List",
				platform: "leetcode",
				problemId: "142",
				url: "https://leetcode.com/problems/linked-list-cycle-ii/",
				difficulty: "medium",
				tags: ["linked-list", "two-pointers"],
			},
		],
	},
];

async function seedSheets() {
	try {
		// Connect to MongoDB
		await mongoose.connect(process.env.MONGODB_URI);
		console.log("Connected to MongoDB");

		// Find admin user
		const admin = await User.findOne({ role: "admin" });
		if (!admin) {
			console.error("Admin user not found. Please create an admin user first.");
			process.exit(1);
		}

		console.log(`Found admin user: ${admin.username}`);

		// Delete existing global sheets with these names to avoid duplicates
		const sheetNames = sheetsData.map((s) => s.name);
		await Sheet.deleteMany({ name: { $in: sheetNames }, isGlobal: true });
		console.log("Cleared existing global sheets");

		// Process each sheet
		for (const sheetData of sheetsData) {
			console.log(`\nProcessing sheet: ${sheetData.name}`);

			// Create or find problems for this sheet
			const problemIds = [];

			for (const problemData of sheetData.problems) {
				// Check if problem already exists
				let problem = await Problem.findOne({
					platform: problemData.platform,
					problemId: problemData.problemId,
					isGlobal: true,
				});

				// If not, create it
				if (!problem) {
					problem = new Problem({
						...problemData,
						userId: admin._id,
						isGlobal: true,
						createdByAdmin: true,
						approvalStatus: "approved",
						status: "todo",
						approvedBy: admin._id,
						approvedAt: new Date(),
					});
					await problem.save();
					console.log(`  Created problem: ${problemData.title}`);
				} else {
					console.log(`  Found existing problem: ${problemData.title}`);
				}

				problemIds.push({
					problemId: problem._id,
					order: problemIds.length,
					addedAt: new Date(),
				});
			}

			// Create the sheet
			const sheet = new Sheet({
				name: sheetData.name,
				description: sheetData.description,
				category: sheetData.category,
				tags: sheetData.tags,
				userId: admin._id,
				isGlobal: true,
				isPublic: true,
				approvalStatus: "approved",
				approvedBy: admin._id,
				approvedAt: new Date(),
				problems: problemIds,
			});

			await sheet.save();
			console.log(
				`✓ Created sheet: ${sheetData.name} with ${problemIds.length} problems`
			);
		}

		console.log("\n✓ Successfully seeded all sheets!");
		console.log(`Total sheets created: ${sheetsData.length}`);

		process.exit(0);
	} catch (error) {
		console.error("Error seeding sheets:", error);
		process.exit(1);
	}
}

seedSheets();
