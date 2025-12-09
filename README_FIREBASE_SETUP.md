# Firebase Authentication Setup

This project uses Firebase Authentication for admin access only. Public pages remain accessible without authentication.

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Firebase Console Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or select an existing one
3. Enable **Authentication** → **Sign-in method** → **Email/Password**
4. Go to **Project Settings** → **Service Accounts**
5. Generate a new private key (downloads JSON file)

### 3. Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Server
PORT=3000
NODE_ENV=development
SESSION_SECRET=your-super-secret-session-key-change-in-production

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/filmyfly?schema=public

# Firebase Admin SDK (Service Account)
# Option 1: Full JSON as string (recommended)
FIREBASE_SERVICE_ACCOUNT_KEY='{"type":"service_account","project_id":"...","private_key":"...","client_email":"..."}'

# Option 2: Individual fields (alternative)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# Firebase Client SDK (for login page)
FIREBASE_API_KEY=your-api-key
FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
FIREBASE_STORAGE_BUCKET=your-project.appspot.com
FIREBASE_MESSAGING_SENDER_ID=123456789
FIREBASE_APP_ID=1:123456789:web:abcdef
```

### 4. Getting Firebase Client Config

1. Go to Firebase Console → Project Settings
2. Scroll down to "Your apps"
3. Click the web icon (`</>`) to add a web app
4. Copy the `firebaseConfig` object values to your `.env` file

### 5. Create Admin User

1. Go to Firebase Console → Authentication → Users
2. Click "Add user"
3. Enter email and password for your admin account
4. This user can now log in at `/admin/login`

## How It Works

- **Public Routes** (`/`, `/about`): No authentication required
- **Admin Routes** (`/admin/*`): Protected by Firebase Authentication
- **Login Page**: `/admin/login` - Only accessible when not logged in
- **Dashboard**: `/admin` - Redirects to login if not authenticated

## Routes

- `GET /admin/login` - Login page
- `POST /admin/login` - Process login (requires Firebase ID token)
- `POST /admin/logout` - Logout and clear session
- `GET /admin` - Admin dashboard (protected)

## Security Notes

1. Never commit your `.env` file
2. Use strong `SESSION_SECRET` in production
3. Keep Firebase service account keys secure
4. Enable HTTPS in production
5. Consider adding IP whitelisting for admin routes in production

