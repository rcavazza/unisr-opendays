# Plan to Remove the "Show Debug" Window in the Frontend

## Task Overview
The task is to remove the debug window that appears in the top right corner of the frontend application. This debug window provides development tools that should not be visible in the production version.

## Current Implementation Analysis
After examining the code, I've found that the debug panel is implemented in the `OpenDayRegistration.tsx` component. Here's what makes up the debug functionality:

1. **State Variables**:
   - `showDebugPanel`: Controls the visibility of the debug panel
   - `rawSlotData`: Stores raw slot data for debugging
   - `discrepancies`: Tracks discrepancies between displayed and expected values

2. **Debug Functions**:
   - `verifySlotDisplay()`: Verifies slot display against raw data
   - `fixDiscrepancies()`: Fixes any discrepancies found

3. **UI Elements**:
   - A button in the top-right corner to toggle the debug panel
   - The debug panel itself with various debugging tools and information

## Removal Plan

### 1. Remove Debug-Related State Variables
Remove the following state variables:
```typescript
// State for debug panel
const [showDebugPanel, setShowDebugPanel] = useState(false);
const [rawSlotData, setRawSlotData] = useState<Record<string, number>>({});
const [discrepancies, setDiscrepancies] = useState<Array<{id: string, displayed: number, expected: number}>>([]);
```

### 2. Remove Debug Functions
Remove the following functions:
- `verifySlotDisplay()` function (lines 565-606)
- `fixDiscrepancies()` function (lines 609-649)

### 3. Remove Debug UI Elements
Remove the entire debug panel UI section:
```jsx
{/* Debug Panel */}
<div className="fixed top-0 right-0 z-50">
  <button
    onClick={() => setShowDebugPanel(!showDebugPanel)}
    className="bg-gray-800 text-white px-3 py-1 text-xs"
  >
    {showDebugPanel ? 'Hide Debug' : 'Show Debug'}
  </button>
  
  {showDebugPanel && (
    <div className="bg-gray-800 text-white p-4 max-w-md max-h-screen overflow-auto text-xs">
      {/* Debug panel content */}
    </div>
  )}
</div>
```

## Implementation Steps
1. Create a backup of the current file (if not using version control)
2. Remove the state variables related to debugging
3. Remove the debug functions
4. Remove the debug UI elements from the JSX
5. Test the application to ensure it works correctly without the debug panel

## Expected Result
After these changes, the debug panel and its toggle button will be completely removed from the frontend application. Users will no longer see the "Show Debug" button in the top right corner of the screen.

## Code Changes
The changes will be made to the file: `front/src/components/OpenDayRegistration.tsx`

### Changes to make:
1. Remove lines 559-562 (state variables)
2. Remove lines 565-606 (verifySlotDisplay function)
3. Remove lines 609-649 (fixDiscrepancies function)
4. Remove lines 659-739 (debug panel UI)