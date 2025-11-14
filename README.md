# It Pencils - Real Estate Deal Analyzer

This is a powerful real estate analysis tool designed to help investors make data-driven decisions. It uses the Google Gemini API to analyze property data from various sources and provides comprehensive financial metrics and investment recommendations.

## Local Development Setup

### Prerequisites

1.  **Node.js and npm**: You must have Node.js (version 18 or newer) and npm installed. You can download them from [nodejs.org](https://nodejs.org/).
2.  **A Code Editor**: Visual Studio Code is recommended.
3.  **A Gemini API Key**: Get a free key from [Google AI Studio](https://aistudio.google.com/app/apikey).
4.  **A Google Client ID for OAuth**: To enable Google Sign-In, you'll need a Client ID. Follow the instructions [here](https://developers.google.com/identity/gsi/web/guides/get-google-api-clientid) to create one.

### Step 1: Install Dependencies

Open your terminal, navigate to the project folder, and run this command to install all the required libraries:

```bash
npm install
```

### Step 2: Configure Your Environment Variables

1.  In the root of the project folder, create a new file named `.env`.
2.  Open the `.env` file and add the following lines, replacing the placeholder values with your actual Gemini API key and your Google Client ID.

    ```
    API_KEY=YOUR_GEMINI_API_KEY_HERE
    VITE_GOOGLE_CLIENT_ID=YOUR_GOOGLE_CLIENT_ID_HERE.apps.googleusercontent.com
    ```
    
    _See `.env.example` for a template._

### Step 3: Run the Development Server

Now, start the Vite development server by running this command in your terminal:

```bash
npm run dev
```

The terminal will show you a message indicating that the server is running, along with a local URL, which is usually `http://localhost:5173/`.

### Step 4: View the Application

Open your web browser and navigate to the URL provided by Vite (e.g., `http://localhost:5173/`). You should now see the landing page with a Google Sign-In button.

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
    -   Add entries that **exactly match** your browser's origin. To be safe, add both common local addresses:
        - `http://localhost:5173`
        - `http://127.0.0.1:5173`
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

---

### If `npm install` or `npm run dev` fails

If you encounter errors during installation or startup (especially after a failed attempt), your `node_modules` directory might be corrupted. To fix this:

1.  **Delete the `node_modules` folder.**
2.  **Delete the `package-lock.json` file.**
3.  Run `npm install` again.
4.  Then run `npm run dev`.