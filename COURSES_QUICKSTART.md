# Course System Quick Start Guide

## What's Implemented

A complete course management system with:

- **Admin**: Create courses with text/video/problem modules
- **Users**: Browse, enroll with Razorpay payment, track progress
- **Payment**: Secure Razorpay integration with signature verification

## Pages Added

### Admin Pages

- **`/admin/courses`** - Course management dashboard
  - View all courses (published and drafts)
  - Create/edit/delete courses
  - Publish/unpublish courses
  - View enrollments and analytics

### User Pages

- **`/courses`** - Browse all published courses

  - Search by title/description
  - Filter by level (Beginner/Intermediate/Advanced)
  - Sort by latest, popular, or price
  - See enrollment status

- **`/courses/:id`** - Course details and enrollment

  - Course overview and instructor info
  - Module list (locked if not enrolled)
  - Enroll button with Razorpay payment
  - Continue learning button for enrolled users

- **`/courses/:id/learn`** - Course player (enrolled users only)
  - Module navigation sidebar
  - Content viewer (YouTube embed, text, problem links)
  - Progress tracking with auto-save
  - Mark modules as complete
  - See time spent on course

## How to Use

### 1. Configure Razorpay

**Backend** (`server/.env`):

```env
RAZORPAY_KEY_ID=rzp_test_XXXXXXXXXXXX
RAZORPAY_KEY_SECRET=YOUR_SECRET_KEY_HERE
```

**Frontend** (`client/.env`):

```env
REACT_APP_RAZORPAY_KEY_ID=rzp_test_XXXXXXXXXXXX
```

See **RAZORPAY_SETUP.md** for detailed instructions on getting your keys.

### 2. Restart Servers

```bash
# Backend
cd server
npm start

# Frontend (in new terminal)
cd client
npm start
```

### 3. Create Your First Course (Admin)

1. Log in as admin
2. Navigate to **Courses** in sidebar
3. Click **Create Course**
4. Fill in course details:
   - Title, description, instructor name
   - Thumbnail URL
   - Price in INR
   - Level (Beginner/Intermediate/Advanced)
   - Tags (comma-separated)
   - Number of modules
5. Click **Next** to configure modules
6. For each module:
   - Enter title and description
   - Choose content type:
     - **Text**: Write markdown content
     - **YouTube**: Paste video URL
     - **Problem**: Select from existing problems
   - Set duration (minutes)
   - Reorder modules using ↑↓ buttons
7. Click **Create Course**
8. Click **Publish** to make it visible to users

### 4. Test Enrollment Flow (User)

1. Log in as a regular user
2. Navigate to **Courses** in sidebar
3. Click on a course
4. Click **Enroll Now**
5. Razorpay Checkout will open
6. Use test card details:
   - Card: `4111 1111 1111 1111`
   - CVV: `123`
   - Expiry: `12/25`
7. Complete payment
8. You'll be redirected to course player
9. Complete modules and track progress

## Module Types Explained

### Text Module

- Write content directly in the modal
- Supports markdown formatting
- Good for: Explanations, instructions, theory

### YouTube Module

- Paste YouTube video URL
- Video embeds in the player
- Good for: Video lectures, tutorials, demonstrations

### Problem Module

- Select from existing problems in database
- Links to problem URL
- Good for: Practice exercises, assignments

## Features Included

### Admin Features

✅ Create courses with multiple modules
✅ Edit existing courses
✅ Delete courses (only if no enrollments)
✅ Publish/unpublish courses
✅ View enrollment statistics
✅ Track revenue per course
✅ See total enrollments and earnings

### User Features

✅ Browse published courses with search
✅ Filter by level and sort options
✅ View course details before enrolling
✅ Secure Razorpay payment integration
✅ Access course content after enrollment
✅ Track module completion
✅ Auto-save progress every 30 seconds
✅ See overall course progress
✅ Resume from last module

### Payment Features

✅ Razorpay order creation
✅ Secure payment signature verification
✅ Support for INR and USD
✅ Test mode for development
✅ Production-ready for live payments
✅ One-time payment per course
✅ Enrollment tied to user account

## Database Models

### Course Model

```javascript
{
  title: String,
  description: String,
  instructor: String,
  thumbnail: String,
  price: Number,
  currency: String,
  modules: [
    {
      title: String,
      description: String,
      contentType: 'text' | 'youtube' | 'problem',
      content: String,
      problemId: ObjectId,
      duration: Number,
      order: Number
    }
  ],
  totalModules: Number,
  totalDuration: Number,
  level: 'Beginner' | 'Intermediate' | 'Advanced',
  tags: [String],
  isPublished: Boolean,
  enrolledCount: Number
}
```

### Enrollment Model

```javascript
{
  userId: ObjectId,
  courseId: ObjectId,
  paymentId: String,
  orderId: String,
  paymentSignature: String,
  amountPaid: Number,
  currency: String,
  paymentStatus: 'pending' | 'completed' | 'failed',
  progress: Number,
  moduleProgress: [
    {
      moduleId: ObjectId,
      completed: Boolean,
      timeSpent: Number,
      lastAccessedAt: Date
    }
  ],
  completedModules: Number,
  isCompleted: Boolean
}
```

## API Endpoints

### Public Routes (`/api/courses`)

- `GET /` - Browse published courses
- `GET /:id` - Get course details
- `GET /my/enrolled` - User's enrolled courses
- `POST /:id/enroll` - Create Razorpay order
- `POST /:id/verify-payment` - Verify and enroll
- `PUT /:courseId/modules/:moduleId/progress` - Update progress

### Admin Routes (`/api/admin/courses`)

- `GET /` - All courses (including drafts)
- `POST /` - Create new course
- `GET /:id` - Course details with stats
- `PUT /:id` - Update course
- `DELETE /:id` - Delete course
- `PATCH /:id/publish` - Toggle publish status
- `GET /:id/enrollments` - View enrollments
- `GET /:id/analytics` - Course analytics

## Testing

### Test Cards (Razorpay Test Mode)

- **Success**: `4111 1111 1111 1111`
- **Failure**: `4111 1111 1111 1234`
- **3D Secure**: `5104 0600 0000 0008`

See more: https://razorpay.com/docs/payments/payments/test-card-details/

## Navigation Structure

```
Sidebar (User):
├── Dashboard
├── Problems
├── Sheets
├── Courses ← NEW
├── Contests
├── Profile
├── Integrations
└── Settings

Sidebar (Admin):
├── Dashboard
├── User Management
├── Global Sheets
├── Global Problems
└── Courses ← NEW
```

## Next Steps

1. **Configure Razorpay** - Add your API keys to .env files
2. **Create Test Course** - Log in as admin and create a sample course
3. **Test Payment** - Enroll as user using test card
4. **Customize Styling** - Adjust UI to match your brand
5. **Go Live** - Switch to Razorpay live keys for production

## Security Notes

🔒 Payment signatures verified using HMAC SHA256
🔒 Key Secret never exposed to frontend
🔒 Enrollment validation prevents duplicate enrollments
🔒 Protected routes ensure only enrolled users access content
🔒 Admin-only course management routes

## Support

- Razorpay documentation: https://razorpay.com/docs/
- Test cards: https://razorpay.com/docs/payments/payments/test-card-details/
- For detailed setup: See **RAZORPAY_SETUP.md**
