# Frontend Fixes Implementation Plan

## Issues Identified

1. **Syntax Error in App.tsx (line 199)**
   - Incorrect style attribute syntax: `style={`font-size`: `50%`}`
   - Needs to be fixed to proper JSX style object syntax

2. **Component Structure Discrepancy**
   - index.tsx imports `App` from "./App"
   - App.tsx only exports `OpenDayRegistration`

3. **Component Duplication**
   - OpenDayRegistration is defined in both:
     - App.tsx
     - components/OpenDayRegistration.tsx

## Implementation Steps

### 1. Fix the Syntax Error in App.tsx

**Current code (line 199):**
```jsx
style={`font-size`: `50%`}
```

**Fix to:**
```jsx
style={{ fontSize: '50%' }}
```

### 2. Fix Component Structure Discrepancy

Create and export an App component in App.tsx that renders OpenDayRegistration:

```tsx
import React from 'react';
import { OpenDayRegistration } from './components/OpenDayRegistration';

export const App = () => {
  return <OpenDayRegistration />;
};
```

### 3. Address Component Duplication

1. Ensure all OpenDayRegistration logic is in components/OpenDayRegistration.tsx
2. Remove the duplicate OpenDayRegistration from App.tsx
3. Update imports accordingly

## Final File Structure

### index.tsx
```tsx
import './index.css';
import React from "react";
import { render } from "react-dom";
import { App } from "./App";
render(<App />, document.getElementById("root"));
```

### App.tsx
```tsx
import React from 'react';
import { OpenDayRegistration } from './components/OpenDayRegistration';

export const App = () => {
  return <OpenDayRegistration />;
};
```

### components/OpenDayRegistration.tsx
(Keep existing implementation with any necessary fixes)

### components/ActivityAccordion.tsx
(Keep existing implementation)

## Implementation Order

1. First, fix the syntax error in App.tsx
2. Then, implement the component structure fix
3. Finally, address the component duplication

## Architecture Diagram

```
index.tsx → App.tsx → components/OpenDayRegistration.tsx → components/ActivityAccordion.tsx
```

This plan ensures a clean component hierarchy while maintaining the existing functionality.