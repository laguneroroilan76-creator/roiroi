/**
 * Migration Script: Convert Reminder.date and Reminder.endDate from String to DateTime
 * 
 * Run this BEFORE running `npx prisma db push` to preserve existing data.
 * 
 * What it does:
 *  1. Reads all existing Reminder rows with string date/endDate values
 *  2. Converts them to proper DateTime values via raw SQL
 *  3. Then you can safely run `npx prisma db push` to change the column type
 * 
 * Usage:
 *   node migrate.js
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function migrateReminderDates() {
  console.log('=== HDI Database Migration ===\n');

  // Step 1: Check current column types
  console.log('[1/4] Checking current Reminder table structure...');
  
  try {
    const columns = await prisma.$queryRaw`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'reminder' 
      AND COLUMN_NAME IN ('date', 'endDate')
    `;
    
    console.log('  Current columns:', columns);
    
    const dateCol = columns.find(c => c.COLUMN_NAME === 'date');
    const endDateCol = columns.find(c => c.COLUMN_NAME === 'endDate');
    
    if (!dateCol) {
      console.log('  ⚠ No "date" column found. Skipping migration.');
      return;
    }

    // If already DateTime, skip
    if (dateCol && dateCol.DATA_TYPE === 'datetime') {
      console.log('  ✅ "date" column is already DATETIME. No migration needed.');
      return;
    }

    // Step 2: Count rows to migrate
    console.log('\n[2/4] Counting reminder rows...');
    const count = await prisma.reminder.count();
    console.log(`  Found ${count} reminder(s) to migrate.`);

    if (count === 0) {
      console.log('  No data to migrate. Safe to run `npx prisma db push`.');
      return;
    }

    // Step 3: Convert string dates to proper format using raw SQL
    // Common string date formats: "2025-01-15", "01/15/2025", "January 15, 2025", ISO strings
    console.log('\n[3/4] Converting string dates to DateTime via SQL...');

    // First, update `date` column — try STR_TO_DATE with common formats
    // MySQL's STR_TO_DATE handles most ISO-like formats
    const updateDate = await prisma.$executeRaw`
      UPDATE reminder 
      SET date = CASE
        WHEN date REGEXP '^[0-9]{4}-[0-9]{2}-[0-9]{2}' THEN date
        WHEN date REGEXP '^[0-9]{2}/[0-9]{2}/[0-9]{4}' THEN STR_TO_DATE(date, '%m/%d/%Y')
        ELSE date
      END
      WHERE date IS NOT NULL AND date != ''
    `;
    console.log(`  Updated ${updateDate} date field(s).`);

    // Update `endDate` column
    const updateEndDate = await prisma.$executeRaw`
      UPDATE reminder 
      SET endDate = CASE
        WHEN endDate REGEXP '^[0-9]{4}-[0-9]{2}-[0-9]{2}' THEN endDate
        WHEN endDate REGEXP '^[0-9]{2}/[0-9]{2}/[0-9]{4}' THEN STR_TO_DATE(endDate, '%m/%d/%Y')
        WHEN endDate IS NULL OR endDate = '' THEN NULL
        ELSE endDate
      END
    `;
    console.log(`  Updated ${updateEndDate} endDate field(s).`);

    // Step 4: Now alter the columns to DATETIME
    console.log('\n[4/4] Altering column types to DATETIME...');
    
    await prisma.$executeRaw`ALTER TABLE reminder MODIFY COLUMN date DATETIME NOT NULL`;
    console.log('  ✅ reminder.date -> DATETIME NOT NULL');

    await prisma.$executeRaw`ALTER TABLE reminder MODIFY COLUMN endDate DATETIME NULL`;
    console.log('  ✅ reminder.endDate -> DATETIME NULL');

    console.log('\n=== Migration Complete! ===');
    console.log('You can now run `npx prisma db push` to sync the Prisma schema.\n');

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error('\nFull error:', error);
    console.error('\nIf the columns are already DATETIME, just run `npx prisma db push` directly.');
  }
}

migrateReminderDates()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
