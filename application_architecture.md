# UNISR OpenDays Application Architecture

## System Architecture Diagram

```mermaid
graph TB
    subgraph "Frontend"
        ReactApp["React Application"]
        I18n["i18n Internationalization"]
        Components["React Components"]
        Services["Frontend Services"]
    end

    subgraph "Backend"
        ExpressServer["Express Server"]
        
        subgraph "Core Services"
            SlotCalcService["Slot Calculation Service"]
            ExpService["Experiences Service"]
            ResService["Reservation Service"]
            CourseExpService["Course Experience Service"]
            HubspotExpService["HubSpot Experience Service"]
            EmailService["Email Service"]
            QRService["QR Code Service"]
        end
        
        subgraph "Database"
            SQLite["SQLite Database"]
            FCFS["FCFS Table"]
            Reservations["Reservations Table"]
            OpenDReservations["OpenD Reservations Table"]
            EmailSubs["Email Subscriptions Table"]
            Experiences["Experiences Table"]
        end
    end

    subgraph "External Services"
        HubSpot["HubSpot CRM"]
        SMTP["SMTP Server"]
    end

    %% Frontend connections
    ReactApp --> I18n
    ReactApp --> Components
    Components --> Services
    Services --> ExpressServer

    %% Backend connections
    ExpressServer --> SlotCalcService
    ExpressServer --> ExpService
    ExpressServer --> ResService
    ExpressServer --> CourseExpService
    ExpressServer --> HubspotExpService
    ExpressServer --> EmailService
    ExpressServer --> QRService

    %% Database connections
    SlotCalcService --> SQLite
    ExpService --> SQLite
    ResService --> SQLite
    CourseExpService --> SQLite
    
    SQLite --> FCFS
    SQLite --> Reservations
    SQLite --> OpenDReservations
    SQLite --> EmailSubs
    SQLite --> Experiences

    %% External connections
    HubspotExpService --> HubSpot
    EmailService --> SMTP
```

## Component Details

### Frontend Components

1. **React Application**
   - Main entry point for the frontend application
   - Handles routing and state management
   - Integrates with internationalization system

2. **i18n Internationalization**
   - Supports multiple languages (English and Italian)
   - Manages language switching based on URL parameters
   - Provides translation functions to components

3. **React Components**
   - **OpenDayRegistration**: Main component for registering for open day events
   - **ConfirmationPage**: Displays confirmation after successful registration
   - **GenitoriPage**: Special page for parents
   - **ActivityAccordion**: Displays available activities with time slots
   - **LoadingOverlay**: Shows loading state during API calls

4. **Frontend Services**
   - **experienceService**: Handles API calls to fetch experiences and make reservations
   - Manages communication with the backend server

### Backend Components

1. **Express Server**
   - Main entry point for the backend application
   - Handles HTTP requests and routing
   - Serves static files and renders EJS templates
   - Manages CORS and middleware configuration

2. **Core Services**
   - **Slot Calculation Service**: Manages slot availability calculations
   - **Experiences Service**: Handles CRUD operations for experiences
   - **Reservation Service**: Manages user reservations
   - **Course Experience Service**: Links courses with experiences
   - **HubSpot Experience Service**: Integrates with HubSpot CRM
   - **Email Service**: Sends confirmation emails with QR codes
   - **QR Code Service**: Generates QR codes for event check-in

3. **Database (SQLite)**
   - **FCFS Table**: First-come-first-served tracking
   - **Reservations Table**: Stores user reservations
   - **OpenD Reservations Table**: Stores open day reservations
   - **Email Subscriptions Table**: Tracks email subscriptions
   - **Experiences Table**: Stores experience details and availability

### External Services

1. **HubSpot CRM**
   - Stores contact information
   - Manages custom objects for courses and experiences
   - Tracks user registrations and participation

2. **SMTP Server**
   - Sends confirmation emails to users
   - Delivers QR codes for event check-in

## Main Application Flows

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant Backend
    participant Database
    participant HubSpot
    participant EmailServer

    %% Registration Flow
    User->>Frontend: Visit OpenDays page with contactID
    Frontend->>Backend: Fetch experiences (contactID, language)
    Backend->>HubSpot: Get contact details & custom objects
    HubSpot-->>Backend: Return contact data
    Backend->>Database: Get available experiences & slots
    Database-->>Backend: Return experiences data
    Backend-->>Frontend: Return experiences with availability
    Frontend->>User: Display available experiences & time slots
    
    User->>Frontend: Select experiences & time slots
    Frontend->>Backend: Make reservation (contactID, experienceID, timeSlotID)
    Backend->>Database: Check slot availability
    Database-->>Backend: Confirm availability
    Backend->>Database: Increment participant count
    Backend->>Database: Store reservation
    Backend->>HubSpot: Update contact with selected experiences
    Backend->>Database: Generate & store QR code
    Backend->>EmailServer: Send confirmation email with QR
    EmailServer->>User: Deliver confirmation email
    Backend-->>Frontend: Return reservation success
    Frontend->>User: Display confirmation page
```

## Data Flow Diagram

```mermaid
flowchart TD
    User[User] --> |Visits website| Frontend
    Frontend --> |API requests| Backend
    Backend --> |Queries| Database
    Backend --> |API calls| HubSpot
    Backend --> |Sends emails| SMTP
    
    subgraph "Data Flow"
        direction TB
        ContactData[Contact Data] --> ExperienceData[Experience Data]
        ExperienceData --> SlotAvailability[Slot Availability]
        SlotAvailability --> Reservation[Reservation]
        Reservation --> QRCode[QR Code]
        QRCode --> EmailConfirmation[Email Confirmation]
    end
    
    Database --> |Stores| ContactData
    Database --> |Stores| ExperienceData
    Database --> |Calculates| SlotAvailability
    Database --> |Records| Reservation
    Backend --> |Generates| QRCode
    Backend --> |Creates| EmailConfirmation
```

## Internationalization Flow

```mermaid
flowchart LR
    URL[URL Language Parameter] --> LanguageProvider
    LanguageProvider --> i18nSystem[i18n System]
    i18nSystem --> TranslationFiles[Translation Files]
    TranslationFiles --> Components[UI Components]
    
    subgraph "Language Detection"
        URL --> |/en/| English
        URL --> |/it/| Italian
        URL --> |Default| English
    end
```

## Slot Calculation Logic

```mermaid
flowchart TD
    Request[Request for Slots] --> StandardizeIDs[Standardize Experience & Time Slot IDs]
    StandardizeIDs --> CheckCache[Check Cache]
    CheckCache --> |Cache Hit| ReturnCached[Return Cached Data]
    CheckCache --> |Cache Miss| QueryDB[Query Database]
    QueryDB --> GetMaxParticipants[Get Max Participants]
    QueryDB --> GetCurrentParticipants[Get Current Participants]
    GetMaxParticipants --> CalculateAvailable[Calculate Available Slots]
    GetCurrentParticipants --> CalculateAvailable
    CalculateAvailable --> CacheResult[Cache Result]
    CacheResult --> ReturnResult[Return Available Slots]
```

## Reservation Process

```mermaid
flowchart TD
    SelectSlot[User Selects Time Slot] --> CheckAvailability[Check Slot Availability]
    CheckAvailability --> |Available| MakeReservation[Make Reservation]
    CheckAvailability --> |Not Available| ShowError[Show Error Message]
    
    MakeReservation --> IncrementCount[Increment Participant Count]
    MakeReservation --> StoreReservation[Store Reservation in Database]
    MakeReservation --> UpdateHubSpot[Update HubSpot Contact]
    
    IncrementCount --> GenerateQR[Generate QR Code]
    StoreReservation --> GenerateQR
    GenerateQR --> SendEmail[Send Confirmation Email]
    SendEmail --> ShowConfirmation[Show Confirmation Page]
```

## HubSpot Integration

```mermaid
flowchart TD
    ContactID[Contact ID from URL] --> FetchContact[Fetch Contact Details]
    FetchContact --> GetCustomObjects[Get Associated Custom Objects]
    GetCustomObjects --> MatchCourses[Match with Courses]
    MatchCourses --> |Match Found| RedirectConfirmation[Redirect to Confirmation]
    MatchCourses --> |No Match| ShowExperiences[Show Available Experiences]
    
    MakeReservation[Make Reservation] --> UpdateCustomObject[Update Custom Object]
    UpdateCustomObject --> AssociateWithContact[Associate with Contact]
```

## Email Service Flow

```mermaid
flowchart TD
    TriggerEmail[Trigger Email Send] --> PrepareData[Prepare Email Data]
    PrepareData --> GenerateQR[Generate QR Code]
    GenerateQR --> SaveQRImage[Save QR Image]
    SaveQRImage --> RenderTemplate[Render Email Template]
    RenderTemplate --> SendEmail[Send Email via SMTP]