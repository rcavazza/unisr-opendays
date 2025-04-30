# Plan to Fix Data Submission from "/front"

## Issue Identified

When submitting data from the "/front" path, the data is not being saved to the database. After investigating the code, I've identified the following issues:

1. The system is using the `opend_reservations` table to track reservations, but this table was not being created in the database initialization code.
2. The system is also using the `experiences` table to store experience data, but this table is not being explicitly created in the database initialization code either.

## Root Cause

The system has been refactored to use the `opend_reservations` table for tracking reservations instead of updating the `current_participants` field in the `experiences` table directly. However, neither of these tables is being properly created during database initialization.

## Solution Plan

### 1. Add Creation of the `opend_reservations` Table

We've already added the creation of the `opend_reservations` table to the database initialization code in server.js:

```javascript
db.run(`CREATE TABLE IF NOT EXISTS opend_reservations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        contact_id TEXT,
        experience_id TEXT,
        time_slot_id TEXT,
        qr_code_url TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);
```

### 2. Add Creation of the `experiences` Table

We need to add the creation of the `experiences` table to the database initialization code in server.js. Based on the fields used in the experiencesService.js file, the table should have the following structure:

```javascript
db.run(`CREATE TABLE IF NOT EXISTS experiences (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        experience_id TEXT,
        title TEXT,
        course TEXT,
        location TEXT,
        date TEXT,
        duration TEXT,
        desc TEXT,
        language TEXT,
        course_type TEXT,
        max_participants INTEGER DEFAULT 0,
        current_participants INTEGER DEFAULT 0,
        ora_inizio TEXT,
        ora_fine TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);
```

### 3. Verify Database Structure

After adding the table creation code, we should verify that the tables are being created correctly by:

1. Restarting the server
2. Checking the database structure
3. Testing the submission process from "/front"

### 4. Update Existing Code if Needed

If there are any other parts of the code that need to be updated to work with the new table structure, we should identify and update them as well.

## Implementation Steps

1. Switch to Code mode to edit the server.js file
2. Add the creation of the `experiences` table to the database initialization code
3. Restart the server
4. Test the submission process from "/front"

## Expected Outcome

After implementing this solution:
1. The `experiences` table will be properly created in the database
2. Data submitted from "/front" will be properly saved to the database
3. The system will be able to track reservations and calculate available slots correctly

## Fallback Plan

If adding the table creation code doesn't resolve the issue, we may need to:

1. Check if there are any other tables that need to be created
2. Verify that the data is being properly inserted into the tables
3. Check if there are any other issues with the database schema or data flow