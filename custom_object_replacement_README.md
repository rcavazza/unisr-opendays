# Custom Object Replacement Implementation

This implementation modifies the server to replace specific custom object IDs with a replacement ID and remove duplicates of the replacement ID.

## Problem Statement

When querying for custom objects associated with a contact in OpenDayRegistration.tsx, if the custom object code is 25417865498, 25417865493, or 25417865392, it should become 25326449768 before being used or saved. After the cycle, any duplicate 25326449768 entries should be removed from the array.

## Implementation Details

### Changes Made

1. Modified the `/api/get_experiences` endpoint in server.js to:
   - Replace custom object IDs 25417865498, 25417865493, and 25417865392 with 25326449768
   - Remove any duplicates of 25326449768 after the replacement
   - Ensure the replacement ID is added to the list of course IDs returned to the frontend

### Files Modified

- **server.js**: Added code to replace specific custom object IDs and remove duplicates

### Files Created

- **restart_server_with_custom_object_replacement.js**: Script to restart the server after applying the changes
- **verify_custom_object_replacement.js**: Script to verify that the changes are working correctly
- **custom_object_replacement_implementation_plan.md**: Detailed implementation plan
- **custom_object_replacement_code.md**: Code snippets for the implementation

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
- The target IDs (25417865498, 25417865493, 25417865392) are being replaced with 25326449768
- Any duplicates of 25326449768 are being removed
- The replacement ID is added to the list of course IDs returned to the frontend

## Expected Behavior

When a contact has custom objects with IDs 25417865498, 25417865493, or 25417865392:
1. These IDs will be replaced with 25326449768
2. Only one instance of 25326449768 will be kept (duplicates removed)
3. The replacement ID will be included in the list of course IDs returned to the frontend

## Logs to Look For

The server logs will show messages like:
- "Replacing custom object ID 25417865493 with 25326449768"
- "Found 25326449768 (count: 1)"
- "Adding replacement ID 25326449768 to matchingCourseIds"

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