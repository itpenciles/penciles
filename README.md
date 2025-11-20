
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
  "subscription_tier" VARCHAR(50), -- Stores the user's selected plan, e.g., 'Free', 'Pro'
  "created_at" TIMESTAMPTZ DEFAULT (now()),
  "updated_at" TIMESTAMPTZ DEFAULT (now()),
  "analysis_count" INTEGER DEFAULT 0, -- Tracks AI analysis usage
  "analysis_limit_reset_at" TIMESTAMPTZ -- Tracks when monthly limits reset
);

CREATE TABLE "properties" (
  "id" SERIAL PRIMARY KEY,
  "user_id" INTEGER NOT NULL REFERENCES "users" ("id") ON DELETE CASCADE,
  "property_data" JSONB NOT NULL,
  "created_at" TIMESTAMPTZ DEFAULT (now()),
  "updated_at" TIMESTAMPTZ DEFAULT (now())
);

CREATE TABLE "subscription_history" (
    "id" SERIAL PRIMARY KEY,
    "user_id" INTEGER REFERENCES "users" ("id"),
    "old_tier" VARCHAR(50),
    "new_tier" VARCHAR(50),
    "change_type" VARCHAR(20), -- 'new', 'upgrade', 'downgrade', 'cancel'
    "amount" NUMERIC,
    "created_at" TIMESTAMPTZ DEFAULT (now())
);

-- [NEW] Table for Dynamic Plan Configuration
CREATE TABLE plans (
    key VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    monthly_price INTEGER DEFAULT 0,
    annual_price INTEGER DEFAULT 0,
    analysis_limit INTEGER DEFAULT 0, -- -1 for unlimited
    features JSONB,
    is_popular BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Optional: Insert Default Plans
INSERT INTO plans (key, name, description, monthly_price, annual_price, analysis_limit, features, is_popular) VALUES
('Free', 'Free', 'For investors just getting started.', 0, 0, 3, '["3 AI Property Analyses (Lifetime)", "Standard Rental Analysis", "Save Properties to Browser"]'::jsonb, false),
('Starter', 'Starter', 'For active investors analyzing a few deals a month.', 9, 90, 15, '["15 AI Property Analyses per Month", "Standard Rental Analysis", "Comparison Tool", "Email Support"]'::jsonb, false),
('Experienced', 'Experienced', 'For growing investors analyzing weekly deals and building their portfolio.', 19, 190, 40, '["40 AI Property Analyses per Month", "Standard Rental Analysis", "Export Data to CSV & PDF", "Comparison Tool", "Email Support"]'::jsonb, true),
('Pro', 'Pro', 'For serious investors needing advanced tools.', 29, 290, 100, '["100 AI Property Analyses per Month", "Creative Finance Calculators", "Comparison Tool", "Export Data", "Priority Support"]'::jsonb, false),
('Team', 'Team', 'For professional teams.', 79, 790, -1, '["Unlimited Analyses", "All Pro Features", "Dedicated Support"]'::jsonb, false)
ON CONFLICT DO NOTHING;
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
