import pg from 'pg';
import dotenv from 'dotenv';
import process from 'node:process';
import { URL } from 'url';

dotenv.config();

const { Pool } = pg;

const dbUrl = process.env.DATABASE_URL;

if (!dbUrl) {
    console.error("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
    console.error("!!! FATAL ERROR: DATABASE_URL environment variable not set. !!!");
    console.error("!!! The application cannot start without a database connection. !!!");
    console.error("!!! Please set the DATABASE_URL in your Render dashboard.    !!!");
    console.error("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
    throw new Error("DATABASE_URL environment variable is not set. Application cannot start.");
}

console.log("DATABASE_URL found. Attempting to connect to database...");

const isProduction = !dbUrl.includes('localhost') && !dbUrl.includes('127.0.0.1');

export const pool = new Pool({
    connectionString: dbUrl,
    ssl: isProduction ? { rejectUnauthorized: false } : false,
});

pool.on('connect', async (client) => {
    try {
        const dbConnectionUrl = new URL(dbUrl);
        const dbName = dbConnectionUrl.pathname.slice(1); // Remove leading slash
        const host = dbConnectionUrl.hostname;
        console.log(`✅ Successfully connected to database: '${dbName}' on host '${host}'.`);

        // --- [NEW] Table Schema Inspector ---
        console.log(`--- [DB Inspector] ---`);
        console.log(`Inspecting schema for 'public.users' table...`);
        const schemaResult = await client.query(
            `SELECT column_name, data_type FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' ORDER BY ordinal_position;`
        );
        
        if (schemaResult.rows.length === 0) {
            console.error(`❌ CRITICAL ERROR: The 'public.users' table was NOT FOUND in the '${dbName}' database.`);
            console.error(`   This is the reason for login failures. Please run the setup SQL script against this database.`);
        } else {
            console.log(`✅ Found ${schemaResult.rows.length} columns in 'public.users':`);
            const columns = schemaResult.rows.map(row => `   - ${row.column_name} (${row.data_type})`).join('\n');
            console.log(columns);
            
            const hasGoogleId = schemaResult.rows.some(row => row.column_name === 'google_id');
            const hasSubscriptionTier = schemaResult.rows.some(row => row.column_name === 'subscription_tier');

            if (hasGoogleId) {
                console.log(`✅ 'google_id' column is present.`);
            } else {
                console.error(`❌ CRITICAL ERROR: The 'google_id' column is MISSING from the 'public.users' table.`);
                console.error(`   This is the reason for login failures. Please run the ALTER TABLE script against this database.`);
            }

            if (hasSubscriptionTier) {
                console.log(`✅ 'subscription_tier' column is present.`);
            } else {
                console.error(`❌ CRITICAL ERROR: The 'subscription_tier' column is MISSING from the 'public.users' table.`);
                console.error(`   This will prevent user subscription status from being saved. Please run the ALTER TABLE script from the README.`);
            }
        }
        console.log(`----------------------`);

    } catch (e) {
        console.error("Could not parse DATABASE_URL or inspect schema, but connection was successful.", e);
    }
});

pool.on('error', (err) => {
    console.error('Unexpected error on idle database client. Exiting.', err);
    process.exit(-1);
});

export const query = (text: string, params?: any[]) => pool.query(text, params);