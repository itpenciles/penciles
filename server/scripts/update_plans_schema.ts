import dotenv from 'dotenv';
import path from 'path';
import process from 'process';
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

import { query } from '../db.js';

const run = async () => {
    try {
        console.log('Adding feature columns to plans table...');
        await query(`
            ALTER TABLE plans 
            ADD COLUMN IF NOT EXISTS can_compare BOOLEAN DEFAULT FALSE,
            ADD COLUMN IF NOT EXISTS can_export_csv BOOLEAN DEFAULT FALSE,
            ADD COLUMN IF NOT EXISTS can_use_advanced_strategies BOOLEAN DEFAULT FALSE;
        `);
        console.log('Columns added successfully.');

        // Update existing plans with defaults
        console.log('Updating existing plans...');

        // Free
        await query(`UPDATE plans SET can_compare=false, can_export_csv=false, can_use_advanced_strategies=false WHERE key='Free'`);

        // Starter
        await query(`UPDATE plans SET can_compare=true, can_export_csv=false, can_use_advanced_strategies=false WHERE key='Starter'`);

        // Experienced (Assuming it should have compare)
        await query(`UPDATE plans SET can_compare=true, can_export_csv=false, can_use_advanced_strategies=false WHERE key='Experienced'`);

        // Pro
        await query(`UPDATE plans SET can_compare=true, can_export_csv=true, can_use_advanced_strategies=true WHERE key='Pro'`);

        // Team
        await query(`UPDATE plans SET can_compare=true, can_export_csv=true, can_use_advanced_strategies=true WHERE key='Team'`);

        console.log('Existing plans updated.');
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};

run();
