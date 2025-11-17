# It Pencils - Real Estate Deal Analyzer

This is a powerful real estate analysis tool designed to help investors make data-driven decisions. It uses the Google Gemini API to analyze property data from various sources and provides comprehensive financial metrics and investment recommendations.

This project is structured as a full-stack application:
-   **Frontend:** A React application built with Vite located in the root directory.
-   **Backend:** A Node.js/Express API server located in the `server/` directory.

---

## Development Setup

### Prerequisites

1.  **Node.js and npm**: You must have Node.js (version 18 or newer) and npm installed.
2.  **A Google Client ID for OAuth**: To enable Google Sign-In, you'll need a Client ID. Follow the instructions [here](https://developers.google.com/identity/gsi/web/guides/get-google-api-clientid) to create one.
3.  **A Gemini API Key**: Get a free key from [Google AI Studio](https://aistudio.google.com/app/apikey).
4.  **PostgreSQL Database**: You need a running PostgreSQL database. You can run one locally using Docker or use a free hosted provider like [Supabase](https://supabase.com/) or [Render](https://render.com/).
5.  **JWT Secret**: A long, random, secret string for signing session tokens. You can generate one using an online tool.


### Step 1: Configure Your Environment Variables

1.  In the root of the project folder, create a new file named `.env`.
2.  Open the `.env` file and add all your secret keys and URLs.

    ```
    # Backend Configuration
    API_KEY=YOUR_GEMINI_API_KEY_HERE
    DATABASE_URL=postgresql://USER:PASSWORD@HOST:PORT/DATABASE
    JWT_SECRET=YOUR_SUPER_SECRET_RANDOM_STRING_HERE

    # Google Auth Configuration (used by both frontend and backend)
    # IMPORTANT: This variable MUST be prefixed with "VITE_" to be accessible by the frontend code.
    VITE_GOOGLE_CLIENT_ID=YOUR_GOOGLE_CLIENT_ID_HERE.apps.googleusercontent.com
    ```
    
### Step 2: Set Up the Database

Connect to your PostgreSQL database and run the following SQL commands to create the necessary tables:

```sql
CREATE TABLE "users" (
  "id" SERIAL PRIMARY KEY,
  "email" VARCHAR(255) UNIQUE NOT NULL,
  "name" VARCHAR(255),
  "google_id" VARCHAR(255) UNIQUE, -- Stores unique Google user ID
  "profile_picture_url" TEXT, -- Stores URL for user's avatar
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

**Terminal 1: Frontend**
```bash
# Install dependencies (only needs to be done once)
npm install

# Run the Vite development server (usually on http://localhost:5173/)
npm run dev
```

**Terminal 2: Backend**
```bash
# No need to install again if you already ran `npm install` in the root.

# Run the backend Express server (usually on http://localhost:3000/)
npm run start:server
```
The frontend and backend will automatically read the `.env` file from the project root. You can now use the application.

---

## Deployment

When you deploy your application to a hosting provider like Render, Heroku, or Vercel, you **must** configure your environment variables in the provider's dashboard. The `.env` file is only for local development and is not uploaded.

### Step-by-Step for Render

1.  Go to your **Render Dashboard** and select your service.
2.  Navigate to the **"Environment"** tab.
3.  Under "Environment Variables," add a new variable for each of the following keys from your `.env` file. Copy the values exactly.
    -   `API_KEY`
    -   `DATABASE_URL`: This is your full connection string from your PostgreSQL provider.
        -   **CRITICAL:** The last part of this URL is your database name (e.g., `.../my_database`). Double-check that this is the correct database where you ran the setup scripts. If you created a database named `itPenciles`, the URL must end with `/itPenciles`.
    -   `JWT_SECRET`
    -   `VITE_GOOGLE_CLIENT_ID`
4.  After adding the variables, Render will automatically trigger a new deployment to apply the settings.

---

## Troubleshooting

### ✅ Fixing Google Login Errors: "Blocked a frame...", "origin is not allowed", or a 403 error

This error means there is **100% a configuration mismatch** between the URL in your browser, your environment variables, and your settings in your Google Cloud Console. The application code is working correctly, but Google is denying the login request. Follow this checklist **exactly** to fix it.

#### Step 1: Check Your Browser URL & Environment Variables

1.  **Look at your browser's address bar.** It will most likely say `http://localhost:5173`. Note the exact origin (the `http://...:port` part).
2.  **Go to the login page.** It will now show a **"Configuration Error"** box with the exact Client ID the app is currently using.
3.  **Compare this Client ID** character-for-character with the Client ID you have in your `.env` file (for local development) or in your Render Environment Variables (for production).
4.  If they don't match, copy the correct ID from Google Console, paste it into your `.env` file (with the `VITE_` prefix) or Render settings, and **immediately proceed to the next step.**

<br>

> **❗️ MOST COMMON MISTAKE: You MUST restart the server!**
> The server only reads environment variables when it first starts. After you save any changes to `.env` (local) or your Render settings (production), you **must stop your local server** (`Ctrl + C`) and **restart it** with `npm run dev` and `npm run start:server`. For Render, saving the variables will trigger a new deployment automatically.

<br>

#### Step 2: Verify Google Cloud Console Settings

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

#### Step 3: Save and Hard Reload

1.  Click the blue **"Save"** button at the bottom of the Google Cloud Console page.
2.  **Wait for 1-2 minutes.** It can take a moment for Google's settings to update across their servers.
3.  Go back to your application tab (e.g., `http://localhost:5173/#/login`).
4.  Perform a **hard reload** to clear your browser's cache:
    -   **Windows/Linux:** `Ctrl + Shift + R`
    -   **Mac:** `Cmd + Shift + R`
5.  Try clicking "Sign in with Google" again. The issue should now be resolved.

### ✅ Fixing Database Errors

#### Scenario 1: `column "google_id" does not exist`

If you see a 500 Internal Server Error after logging in, and your server logs show an error like `column "google_id" of relation "users" does not exist`, it means your database schema is out of date. You likely created the `users` table before the Google-specific columns were added.

**Do not drop your tables.** You can fix this without losing any data.

1.  Connect to your PostgreSQL database with your database client (DBeaver, pgAdmin, etc.).
2.  Run the following SQL commands to add the missing columns:

```sql
-- Adds the column to store the unique Google user ID
ALTER TABLE "users" ADD COLUMN "google_id" VARCHAR(255) UNIQUE;

-- Adds the column to store the URL for the user's profile picture
ALTER TABLE "users" ADD COLUMN "profile_picture_url" TEXT;
```

After running these commands, the error will be resolved. You do not need to redeploy your application.

#### Scenario 2: What if I'm connected to the right database, but still get the error?

This can happen if you have multiple databases within one PostgreSQL instance (e.g., `itPenciles`, `terrace_db`, `postgres`). Your `DATABASE_URL` might be pointing to a database where you forgot to run the setup scripts.

1.  **Check your server logs** for the line `✅ Successfully connected to database: 'your_db_name'`. This tells you exactly which database the application is using.
2.  **Confirm this is the database you intended.** If not, correct the `DATABASE_URL` in your Render Environment settings.
3.  If the name is correct, it means the schema inside `'your_db_name'` is wrong.
4.  **Connect your database client directly to `'your_db_name'`** and run the `ALTER TABLE` commands from Scenario 1. This ensures you are updating the correct database that your application is actively connected to.
