import dotenv from 'dotenv';
import path from 'path';
import process from 'process';
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
const run = async () => {
    try {
        // Dynamic import to ensure dotenv loads first
        const { query } = await import('../db.js');
        console.log('Adding granular feature columns to plans table...');
        await query(`
            ALTER TABLE plans 
            ADD COLUMN IF NOT EXISTS can_wholesale BOOLEAN DEFAULT FALSE,
            ADD COLUMN IF NOT EXISTS can_subject_to BOOLEAN DEFAULT FALSE,
            ADD COLUMN IF NOT EXISTS can_seller_finance BOOLEAN DEFAULT FALSE,
            ADD COLUMN IF NOT EXISTS can_brrrr BOOLEAN DEFAULT FALSE,
            ADD COLUMN IF NOT EXISTS can_access_comparables BOOLEAN DEFAULT FALSE,
            ADD COLUMN IF NOT EXISTS can_access_projections BOOLEAN DEFAULT FALSE;
        `);
        console.log('Columns added successfully.');
        // Migrate existing data
        console.log('Migrating existing data based on can_use_advanced_strategies...');
        // If advanced strategies were enabled, enable all specific strategies
        await query(`
            UPDATE plans 
            SET 
                can_wholesale = TRUE,
                can_subject_to = TRUE,
                can_seller_finance = TRUE,
                can_brrrr = TRUE
            WHERE can_use_advanced_strategies = TRUE;
        `);
        // Initialize new features (Comparables, Projections)
        // Pro and Team get everything
        await query(`
            UPDATE plans 
            SET can_access_comparables = TRUE, can_access_projections = TRUE 
            WHERE key IN ('Pro', 'Team', 'PayAsYouGo');
        `);
        // Experienced gets Comparables (based on "Property Comparison Tool" feature text)
        await query(`
            UPDATE plans 
            SET can_access_comparables = TRUE 
            WHERE key = 'Experienced';
        `);
        // Starter gets Comparables (limited, but flag enables the tab)
        await query(`
            UPDATE plans 
            SET can_access_comparables = TRUE 
            WHERE key = 'Starter';
        `);
        console.log('Data migration complete.');
        process.exit(0);
    }
    catch (e) {
        console.error(e);
        process.exit(1);
    }
};
run();
