# It Pencils - Real Estate Deal Analyzer

This is a powerful real estate analysis tool designed to help investors make data-driven decisions. It uses the Google Gemini API to analyze property data from various sources and provides comprehensive financial metrics and investment recommendations.

This project is structured as a full-stack application:
-   **Frontend:** A React application built with Vite located in the root directory.
-   **Backend:** A Node.js/Express API server located in the `server/` directory.

---

## Frontend Development Setup

### Prerequisites

1.  **Node.js and npm**: You must have Node.js (version 18 or newer) and npm installed.
2.  **A Google Client ID for OAuth**: To enable Google Sign-In, you'll need a Client ID. Follow the instructions [here](https://developers.google.com/identity/gsi/web/guides/get-google-api-clientid) to create one.

### Step 1: Configure Your Environment Variables

1.  In the root of the project folder, create a new file named `.env`.
2.  Open the `.env` file and add your Google Client ID.

    ```
    VITE_GOOGLE_CLIENT_ID=YOUR_GOOGLE_CLIENT_ID_HERE.apps.googleusercontent.com
    ```
    
    _Note: The `API_KEY` is now managed by the backend server._

### Step 2: Install Dependencies & Run

```bash
# Install frontend dependencies
npm install

# Run the Vite development server (usually on http://localhost:5173/)
npm run dev
```

---

## Backend Development Setup

### Prerequisites

1.  **A Gemini API Key**: Get a free key from [Google AI Studio](https://aistudio.google.com/app/apikey).
2.  **PostgreSQL Database**: You need a running PostgreSQL database. You can run one locally using Docker or use a free hosted provider like [Supabase](https://supabase.com/) or [Render](https://render.com/).
3.  **JWT Secret**: A long, random, secret string for signing session tokens. You can generate one using an online tool.

### Step 1: Configure Your Backend Environment Variables

In the same `.env` file in the project root, add the following backend variables:

```
# Backend Configuration
API_KEY=YOUR_GEMINI_API_KEY_HERE
DATABASE_URL=postgresql://USER:PASSWORD@HOST:PORT/DATABASE
JWT_SECRET=YOUR_SUPER_SECRET_RANDOM_STRING_HERE
```

### Step 2: Set Up the Database

Connect to your PostgreSQL database and run the following SQL commands to create the necessary tables:

```sql
CREATE TABLE "users" (
  "id" SERIAL PRIMARY KEY,
  "email" VARCHAR(255) UNIQUE NOT NULL,
  "name" VARCHAR(255),
  "password_hash" VARCHAR(255), -- Can be NULL for Google OAuth users
  "created_at" TIMESTAMPTZ DEFAULT (now())
);

CREATE TABLE "properties" (
  "id" SERIAL PRIMARY KEY,
  "user_id" INTEGER NOT NULL REFERENCES "users" ("id") ON DELETE CASCADE,
  "property_data" JSONB NOT NULL,
  "created_at" TIMESTAMPTZ DEFAULT (now()),
  "updated_at" TIMESTAMPTZ DEFAULT (now())
);
```

### Step 3: Install Dependencies & Run

You will need two separate terminal windows to run the frontend and backend simultaneously.

```bash
# In your second terminal window:

# Install backend dependencies
npm install

# Run the backend Express server (usually on http://localhost:3000/)
npm run start:server
```

The backend server will automatically read the `.env` file and connect to your database. You can now use the frontend application, and it will make API calls to your local backend server.

---

## Deployment

When you deploy your application to a hosting provider like Render, Heroku, or Vercel, you **must** configure your environment variables in the provider's dashboard. The `.env` file is only for local development and is not uploaded.

### Step-by-Step for Render

1.  Go to your **Render Dashboard** and select your service.
2.  Navigate to the **"Environment"** tab.
3.  Under "Environment Variables," add a new variable for each of the following keys from your `.env` file. Copy the values exactly.
    -   `VITE_GOOGLE_CLIENT_ID`
    -   `API_KEY`
    -   `DATABASE_URL` (Ensure this points to a production database that Render can access, not `localhost`).
    -   `JWT_SECRET`
4.  After adding the variables, Render will automatically trigger a new deployment to apply the settings.

---

## Troubleshooting

### Error: `Configuration Error`, `The given origin is not allowed...`, or a 403 error from `accounts.google.com`

This error means there is **100% a configuration mismatch** between the URL in your browser, your `.env` file, and your settings in your Google Cloud Console. The application code is working correctly, but Google is denying the login request. Follow this checklist **exactly** to fix it.

#### ✅ Step 1: Check Your Browser URL & `.env` File

1.  **Look at your browser's address bar.** It will most likely say `http://localhost:5173`. Note the exact origin (the `http://...:port` part).
2.  **Go to the login page.** It will now show a **"Configuration Notice"** box with the exact Client ID the app is currently using.
3.  **Compare this Client ID** character-for-character with the Client ID shown in your Google Cloud Console.
4.  If they don't match, copy the correct ID from Google Console, paste it into your `.env` file, and **immediately proceed to the next step.**

<br>

> **❗️ MOST COMMON MISTAKE: You MUST restart the server!**
> The server only reads the `.env` file when it first starts. After you save any changes to `.env`, you **must stop your development server** (press `Ctrl + C` in the terminal) and **restart it** with `npm run dev`. If you don't, the app will keep using the old, incorrect Client ID.

<br>

#### ✅ Step 2: Verify Google Cloud Console Settings

1.  Go to the **Google Cloud Console Credentials page**: [https://console.cloud.google.com/apis/credentials](https://console.cloud.google.com/apis/credentials).
2.  Select the correct project, then click on your "OAuth 2.0 Client ID" to edit it.

3.  **Check "Authorized JavaScript origins":**
    -   This section tells Google which websites are allowed to use this Client ID.
    -   Click **"+ ADD URI"**.
    -   Add entries that **exactly match** your browser's origin. For local development, add both:
        - `http://localhost:5173`
        - `http://127.0.0.1:5173`
    -   For your live deployed site (e.g., on Render), add your production URL:
        - `https://your-app-name.onrender.com`
    -   **Critical:** Check for typos. It must be `http`, not `https`. There must be **NO trailing slash (`/`)**. The port number must match what's in your browser.

4.  **Check "Authorized redirect URIs":**
    -   **This section MUST BE EMPTY.**
    -   The Google Sign-In library used in this app does not use redirects. Having a redirect URI configured **will cause an error**.
    -   If there are any entries here, click the trash can icon next to each one to remove them.

#### ✅ Step 3: Save and Hard Reload

1.  Click the blue **"Save"** button at the bottom of the Google Cloud Console page.
2.  **Wait for 1-2 minutes.** It can take a moment for Google's settings to update across their servers.
3.  Go back to your application tab (e.g., `http://localhost:5173/#/login`).
4.  Perform a **hard reload** to clear your browser's cache:
    -   **Windows/Linux:** `Ctrl + Shift + R`
    -   **Mac:** `Cmd + Shift + R`
5.  Try clicking "Sign in with Google" again. The issue should now be resolved.