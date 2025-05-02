# Plan to Remove "durata" (Duration) from the UI

## Current Locations of "durata" in the Frontend

1. **Translation Files**:
   - In `front/src/locales/it/translation.json`: 
     - Main translation key: `"duration": "Durata",` (line 9)
     - In each activity's duration field (lines 37, 44, 51, 58, 65)
   - In `front/src/locales/en/translation.json` (corresponding English translations)

2. **Data Structure**:
   - In `front/src/data/activities.ts`: 
     - The `ActivityDetails` interface includes a `duration` property (line 17)
     - Each activity in `getActivities` function uses the translation key for duration

3. **UI Components**:
   - In `front/src/components/ActivityAccordion.tsx`:
     - Displays duration in the UI (lines 59-62)
   - In `front/src/components/ConfirmationPage.tsx`:
     - The `SelectedActivity` interface includes a `duration` field (line 11)
     - Displays duration in the UI (lines 182-184)
   - In `front/src/components/OpenDayRegistration.tsx`:
     - Includes duration when preparing data for the confirmation page (line 524)

## Implementation Steps

### Step 1: Remove from Translation Files
- Remove the `"duration"` key and its translation from both Italian and English translation files
- Remove the duration field from each activity in the translation files

### Step 2: Update Data Structure
- Remove the `duration` property from the `ActivityDetails` interface
- Remove the duration field from each activity in the `getActivities` function

### Step 3: Update UI Components
- Remove the duration display from the `ActivityAccordion` component
- Remove the duration field from the `SelectedActivity` interface in the `ConfirmationPage` component
- Remove the duration display from the `ConfirmationPage` component
- Remove the duration field when preparing data in the `OpenDayRegistration` component

## Detailed Changes

### 1. Translation Files

#### In `front/src/locales/it/translation.json`:
- Remove line 9: `"duration": "Durata",`
- Remove the `"duration"` field from each activity:
  - Line 37: `"duration": "45 minuti",`
  - Line 44: `"duration": "60 minuti",`
  - Line 51: `"duration": "30 minuti",`
  - Line 58: `"duration": "45 minuti",`
  - Line 65: `"duration": "90 minuti",`

#### In `front/src/locales/en/translation.json`:
- Remove line 9: `"duration": "Duration",`
- Remove the `"duration"` field from each activity:
  - Line 37: `"duration": "45 minutes",`
  - Line 44: `"duration": "60 minutes",`
  - Line 51: `"duration": "30 minutes",`
  - Line 58: `"duration": "45 minutes",`
  - Line 65: `"duration": "90 minutes",`

### 2. Data Structure

#### In `front/src/data/activities.ts`:
- Remove the `duration` property from the `ActivityDetails` interface (line 17)
- Remove the `duration` field from each activity in the `getActivities` function:
  - Line 28: `duration: t('activities.1.duration'),`
  - Line 53: `duration: t('activities.2.duration'),`
  - Line 78: `duration: t('activities.3.duration'),`
  - Line 103: `duration: t('activities.4.duration'),`
  - Line 123: `duration: t('activities.5.duration'),`

### 3. UI Components

#### In `front/src/components/ActivityAccordion.tsx`:
- Remove the entire div that displays duration (lines 59-62):
```tsx
<div>
  <span className="font-medium text-yellow-300">{t('duration')}:</span>{' '}
  <span className="font-bold"> {activity.duration}</span>
</div>
```

#### In `front/src/components/ConfirmationPage.tsx`:
- Remove the `duration` field from the `SelectedActivity` interface (line 11)
- Remove the div that displays duration in the UI (lines 182-184):
```tsx
<div className="text-yellow-300 font-bold">
  {t('duration')}: {activity.duration || t('durationNotAvailable')}
</div>
```

#### In `front/src/components/OpenDayRegistration.tsx`:
- Remove the `duration` field when preparing data for the confirmation page (line 524):
```tsx
duration: activity?.duration