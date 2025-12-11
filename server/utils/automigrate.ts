
import { query } from '../db.js';

export const runAutoMigration = async () => {
    try {
        console.log('--- [Auto-Migration] Checking database schema... ---');

        // Add share_token and is_public to properties table
        await query(`
            ALTER TABLE properties 
            ADD COLUMN IF NOT EXISTS share_token UUID UNIQUE DEFAULT NULL,
            ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT FALSE;
        `);
        console.log("✅ [Auto-Migration] Ensure 'properties' table has share_token and is_public columns.");

    } catch (error) {
        console.error('❌ [Auto-Migration] Failed to run schema updates:', error);
        // We don't exit process here, just log error, to avoid crashing if DB is slightly efficient but usable
    }
};
