# Modified Custom Object Replacement Implementation

This implementation modifies the server to replace specific custom object IDs with a replacement ID when querying the database, but keeps the original IDs in the response to the frontend.

## Problem Statement

When querying for custom objects associated with a contact in OpenDayRegistration.tsx, if the custom object code is 25417865498, 25417865493, or 25417865392, it should become 25326449768 before being used to query the database. After the cycle, any duplicate 25326449768 entries should be removed from the array. However, the original custom object IDs should be preserved in the response to the frontend.

## Implementation Details

### Changes Made

1. Modified the `/api/get_experiences` endpoint in server.js to:
   - Keep the original custom object IDs for the response to the frontend
   - Create a separate list of modified IDs (with replacements and duplicates removed) for querying the database
   - Use the modified IDs only for the database query, not for the frontend response

### Key Differences from Previous Implementation

1. **Original IDs Preserved**: The frontend now receives the original custom object IDs instead of the modified ones
2. **Database Query Unchanged**: The database query still uses the modified IDs with replacements and deduplication
3. **User Experience**: The frontend logic continues to work with the original IDs, while the backend still retrieves the correct experiences

### Files Modified

- **server.js**: Modified to maintain two separate lists of IDs (original and modified)
- **restart_server_with_custom_object_replacement.js**: Updated to handle the new implementation
- **verify_custom_object_replacement.js**: Updated to test the new implementation

### Files Created

- **modified_implementation_plan.md**: Detailed implementation plan for the modified approach
- **user_experience_impact.md**: Analysis of how the modified implementation affects the user experience

## Testing Instructions

1. First, stop the currently running server (Ctrl+C in the terminal where it's running)
2. Run the restart script to apply the changes:
   ```
   node restart_server_with_custom_object_replacement.js
   ```
3. In a separate terminal, run the verification script to test if the changes are working:
   ```
   node verify_custom_object_replacement.js
   ```

The verification script will check if:
- The original target IDs are preserved in the response to the frontend
- The experiences are still returned correctly (indicating that the database query is using the modified IDs)

## Expected Behavior

When a contact has custom objects with IDs 25417865498, 25417865493, or 25417865392:
1. These IDs will be preserved in the response to the frontend
2. For the database query, these IDs will be replaced with 25326449768, and duplicates will be removed
3. The experiences returned will be based on the modified IDs used for the database query

## Logs to Look For

The server logs will show messages like:
- "Original match found: 25417865493 matches 25417865493"
- "Replacing custom object ID 25417865493 with 25326449768 for database query"
- "Found 25326449768 for query (count: 1)"
- "Returning original filtered object IDs: 25417865493, 25417865498"

## Troubleshooting

If the verification script fails:
1. Check the server logs for any errors
2. Make sure the server is running
3. Verify that the contact ID used in the verification script has at least one of the target custom object IDs

## Rollback Plan

If issues are encountered:
1. Stop the server
2. Restore the backup of server.js (server.js.bak)
3. Restart the server