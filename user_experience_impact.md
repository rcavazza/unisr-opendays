# User Experience Impact of the Modified Implementation

## Current User Experience

Currently, when a user with custom object IDs 25417865498, 25417865493, or 25417865392 accesses the OpenDayRegistration component:

1. The frontend makes a request to `/api/get_experiences` with the user's contactID
2. The server replaces these IDs with 25326449768 and removes duplicates
3. The server uses these modified IDs to query the database for experiences
4. The server returns both the experiences and the modified IDs to the frontend
5. The frontend displays the experiences and uses the modified IDs for further operations

This means that from the frontend's perspective, the original IDs are completely replaced with 25326449768, and any logic that depends on the specific original IDs might not work as expected.

## Modified User Experience

With the proposed changes:

1. The frontend still makes a request to `/api/get_experiences` with the user's contactID
2. The server keeps the original IDs for the response but creates a modified list for the database query
3. The server uses the modified IDs (with replacements and deduplication) to query the database
4. The server returns the experiences (based on the modified IDs) but includes the original IDs in the response
5. The frontend displays the experiences but continues to use the original IDs for further operations

### Key Differences for the User

1. **Visible Experiences**: The user will see the same experiences in both implementations. This is because the database query still uses the modified IDs, so the same experiences are retrieved.

2. **Frontend Logic**: Any frontend logic that depends on specific course IDs will continue to work with the original IDs. This could include:
   - Highlighting specific courses
   - Filtering or sorting based on course IDs
   - Tracking selected courses
   - Submitting course selections to other APIs

3. **Data Consistency**: The frontend will maintain consistency with other parts of the system that expect the original IDs. This could be important for:
   - Analytics tracking
   - Integration with other systems
   - Debugging and troubleshooting
   - Future feature development

4. **Backend Processing**: The backend will still benefit from the ID replacement and deduplication when querying the database, ensuring that the correct experiences are retrieved efficiently.

## Practical Example

Let's consider a concrete example:

1. A user has custom objects with IDs 25417865498 and 25417865493
2. With the current implementation:
   - The frontend would receive matchingCourseIds = [25326449768]
   - Any logic looking for 25417865498 or 25417865493 would fail
   - The user would see experiences associated with 25326449768

3. With the modified implementation:
   - The frontend would receive matchingCourseIds = [25417865498, 25417865493]
   - Logic looking for these specific IDs would continue to work
   - The user would still see the same experiences (associated with 25326449768)

This approach gives us the best of both worlds: the frontend maintains its expected behavior with the original IDs, while the backend efficiently retrieves the correct experiences using the modified IDs.

## Technical Flow Diagram

```
┌─────────────┐                  ┌─────────────┐                  ┌─────────────┐
│   Frontend  │                  │    Server   │                  │   Database  │
└──────┬──────┘                  └──────┬──────┘                  └──────┬──────┘
       │                                │                                │
       │  Request experiences           │                                │
       │  with contactID                │                                │
       │────────────────────────────────>                                │
       │                                │                                │
       │                                │  Extract original              │
       │                                │  custom object IDs             │
       │                                │  [25417865498,                 │
       │                                │   25417865493]                 │
       │                                │                                │
       │                                │  Create modified IDs           │
       │                                │  for database query            │
       │                                │  [25326449768]                 │
       │                                │                                │
       │                                │                                │
       │                                │  Query experiences             │
       │                                │  with modified IDs             │
       │                                │────────────────────────────────>
       │                                │                                │
       │                                │                                │
       │                                │  Return experiences            │
       │                                │  for ID 25326449768            │
       │                                │<────────────────────────────────
       │                                │                                │
       │  Response with:                │                                │
       │  - Experiences                 │                                │
       │  - Original IDs                │                                │
       │  [25417865498,                 │                                │
       │   25417865493]                 │                                │
       │<────────────────────────────────                                │
       │                                │                                │
       │  Frontend logic                │                                │
       │  continues to work             │                                │
       │  with original IDs             │                                │
       │                                │                                │