# Final Implementation Plan: Selectable/Deselectable Radio Buttons

## Requirements
- Keep the radio button appearance and behavior
- Make the radio buttons selectable/deselectable
- Ensure the visual indication (black dot) appears when selected

## Solution Approach
We'll keep the radio buttons but modify how we handle the selection/deselection logic:

1. Keep the standard radio button input
2. Use the onChange handler to call onTimeSlotSelect for normal selection
3. Add a custom click handler specifically for deselection
4. The click handler will check if the radio is already selected
5. If already selected, it will call onTimeSlotSelect after a short delay to deselect it

## Code Implementation

```tsx
<input
  type="radio"
  name={`timeSlot-${activity.id}`}
  value={slot.id}
  checked={selectedSlot === slot.id}
  // Use onChange for normal selection
  onChange={() => {
    // Only handle selection, not deselection
    if (selectedSlot !== slot.id) {
      onTimeSlotSelect(activity.id, slot.id);
    }
  }}
  // Add custom click handler specifically for deselection
  onClick={() => {
    if (isDisabled) return; // Don't do anything if disabled
    
    // If already selected, handle deselection
    if (selectedSlot === slot.id) {
      // Call onTimeSlotSelect to handle deselection
      onTimeSlotSelect(activity.id, slot.id);
    }
  }}
  className="h-4 w-4 text-yellow-300 border-white/30"
  disabled={isDisabled}
/>
```

## How This Works

1. **Selection Process:**
   - User clicks an unselected radio button
   - The onChange event fires first
   - Since selectedSlot !== slot.id, it calls onTimeSlotSelect
   - The onClick event fires next, but since selectedSlot !== slot.id (at the time of the click), it does nothing
   - The radio button shows the visual indication (black dot)

2. **Deselection Process:**
   - User clicks an already selected radio button
   - The onChange event fires first, but since selectedSlot === slot.id, it does nothing
   - The onClick event fires next, and since selectedSlot === slot.id, it calls onTimeSlotSelect
   - The parent component updates the selectedTimeSlots state, removing the selection
   - The radio button's checked state becomes false, removing the visual indication

## Next Steps
1. Switch to Code mode to implement this solution
2. Test the implementation to ensure it works as expected
3. Verify that the radio buttons show the visual indication when selected
4. Verify that the radio buttons can be both selected and deselected