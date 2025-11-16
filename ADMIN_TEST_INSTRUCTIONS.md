# Admin Access Test Instructions

## 🔐 Admin Account Credentials

**Login Options:**
- **Username:** admin  
- **Email:** admin@codeit.com  
- **Password:** admin123

You can login using either the username "admin" OR the email "admin@codeit.com" with password "admin123"

## ✅ How to Test Admin Access

### Step 1: Access the Application
- Open your browser and go to: http://localhost:3000

### Step 2: Logout Current User (if logged in)
- Click on your profile picture in the top right
- Click "Sign out"

### Step 3: Login as Admin
- Click "Login" or go to the login page
- Enter credentials (either option works):
  - **Option 1:** Username: admin, Password: admin123
  - **Option 2:** Email: admin@codeit.com, Password: admin123
- Click "Sign In"

### Step 4: Verify Admin Access
- Look for admin menu items in the navbar dropdown (clicking your profile picture)
- You should see:
  - Admin Dashboard
  - Manage Sheets
  - Manage Problems

### Step 5: Test Admin Features
- Click "Admin Dashboard" - should load successfully
- Navigate to "Manage Sheets" - can create global sheets
- Navigate to "Manage Problems" - can create global problems

## 🚫 Access Control Verification

### Test 1: Non-Admin Account
- Login with any other account (like your previous account)
- Admin menu items should NOT appear in the navbar
- Direct access to `/admin` should show "Access Denied"

### Test 2: Direct URL Access
- Try accessing `/admin`, `/admin/sheets`, `/admin/problems` with non-admin account
- Should redirect to dashboard or show access denied

## 🛠️ Admin Features Available

1. **Admin Dashboard:** Overview and statistics
2. **Manage Sheets:** Create/edit/delete global sheets visible to all users
3. **Manage Problems:** Create/edit/delete global problems visible to all users

## 📱 Server Status
- Backend: http://localhost:5000 ✅
- Frontend: http://localhost:3000 ✅
- Database: MongoDB connected ✅

---

**Note:** Only the account with username "admin" can access admin features. This is enforced both on the frontend (UI visibility) and backend (API access control).