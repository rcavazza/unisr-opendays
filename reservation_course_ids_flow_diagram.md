# Data Flow Diagram for Course IDs Implementation

The following diagram illustrates how the matchingCourseIds will flow through the system:

```mermaid
sequenceDiagram
    participant User
    participant Frontend as OpenDayRegistration Component
    participant Service as experienceService.ts
    participant Backend as /api/update-selected-experiences
    participant HubSpot
    participant Email as Email Service

    User->>Frontend: Select experiences
    Frontend->>Service: fetchExperiences(contactID, lang)
    Service-->>Frontend: Return experiences & matchingCourseIds
    
    Note over Frontend: Store matchingCourseIds in state
    
    User->>Frontend: Submit form
    Frontend->>Service: resetReservations(contactID)
    Service-->>Frontend: Reservations reset
    
    loop For each selected time slot
        Frontend->>Service: makeReservation(contactID, activityId, timeSlotId, dbId)
        Service-->>Frontend: Reservation result
    end
    
    Frontend->>Service: updateSelectedExperiences(contactID, experienceIds, matchingCourseIds, lang)
    Service->>Backend: POST with contactID, experienceIds, matchingCourseIds
    
    Backend->>HubSpot: Update contact property
    HubSpot-->>Backend: Update confirmation
    
    Backend->>Backend: Get courses based on matchingCourseIds
    Backend->>Email: Send email with experiences and courses
    Email-->>Backend: Email sent confirmation
    
    Backend-->>Service: Success response
    Service-->>Frontend: Success response
    
    Frontend->>User: Navigate to confirmation page
```

## Key Changes in Data Flow

1. **Frontend to Service**:
   - The `matchingCourseIds` are now passed from the OpenDayRegistration component to the experienceService's `updateSelectedExperiences` function

2. **Service to Backend**:
   - The experienceService now includes `matchingCourseIds` in the request body sent to the `/api/update-selected-experiences` endpoint

3. **Backend Processing**:
   - The backend endpoint extracts `matchingCourseIds` from the request
   - It uses these IDs to fetch the corresponding courses from corsi.json
   - The courses are included in the email sent to the user

This implementation ensures that the correct course IDs are passed from the frontend to the backend while maintaining all existing functionality.