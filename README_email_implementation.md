# Email Implementation for Front Page Form Submission

This document provides instructions for implementing email sending functionality for the form submission in the "/front" page after updating HubSpot.

## Overview

When a user submits the form in the "/front" page, the system:
1. Updates the HubSpot contact with the selected experiences
2. Sends a confirmation email to the user with the selected experiences

The email uses the `email_courses.ejs` template, which is included in the `email.ejs` template when the `type` parameter is set to `2`.

## Implementation Files

The implementation consists of the following files:

1. `submit_email_route.js` - Contains the code for the `/api/update-selected-experiences` endpoint with email sending functionality
2. `apply_server_patch.js` - Script to apply the changes to server.js
3. `fix_submit_email.js` - Script to fix potential issues with the email sending functionality
4. `test_email_implementation.js` - Script to test the email sending functionality
5. `restart_after_email_implementation.js` - Script to restart the server after applying the changes
6. `README_email_implementation.md` - This documentation file

## Implementation Steps

Follow these steps to implement the email sending functionality:

### Step 1: Apply the Server Patch

Run the `apply_server_patch.js` script to replace the existing `/api/update-selected-experiences` endpoint with the new one that includes email sending functionality:

```bash
node apply_server_patch.js
```

This script will:
- Create a backup of the original server.js file as server.js.bak
- Replace the existing endpoint with the new one from submit_email_route.js

### Step 2: Fix Potential Issues

Run the `fix_submit_email.js` script to fix potential issues with the email sending functionality:

```bash
node fix_submit_email.js
```

This script will:
- Apply fixes to ensure the language is correctly extracted from the request
- Ensure the QR code URL is correctly formatted
- Improve error handling for experience fetching
- Ensure the email template data includes all necessary fields
- Check if the email_courses.ejs templates exist and are correctly referenced in email.ejs

### Step 3: Restart the Server

Restart the server to apply the changes using the `restart_after_email_implementation.js` script:

```bash
node restart_after_email_implementation.js
```

This script will:
- Find and kill the current server process
- Start a new server process with the updated code
- Provide feedback on the restart process

## Testing

### Automated Testing

Run the `test_email_implementation.js` script to test the email sending functionality:

```bash
node test_email_implementation.js
```

This script will:
- Prompt you for a valid contactID
- Prompt you for the language (en/it)
- Prompt you for experience IDs (comma-separated)
- Make a request to the `/api/update-selected-experiences` endpoint
- Provide feedback on the test results

### Manual Testing

To manually test the email sending functionality:

1. Open the "/front" page with a valid contactID
2. Select some experiences
3. Submit the form
4. Check if the HubSpot contact is updated with the selected experiences
5. Check if the confirmation email is sent to the user

## Troubleshooting

If the email is not being sent:

1. Check if the SENDMAIL environment variable is set to 1
2. Check if the email templates exist and are correctly referenced
3. Check the server logs for any errors
4. Run the fix_submit_email.js script to fix potential issues

Common issues and solutions:

| Issue | Solution |
|-------|----------|
| Email not sent | Check SENDMAIL environment variable |
| Template not found | Check if email_courses.ejs exists in views/en and views/it |
| Language not detected | Check URL path or query parameter |
| Experience details missing | Check database connection and experience IDs |

## Email Template Structure

The email template uses the following structure:

```javascript
{
    name: contact.firstname,
    email: contact.email,
    qrCode: qrCodeUrl,
    type: 2, // Use email_courses.ejs template
    fieldData: {
        experiences: [
            {
                title: "Experience Title",
                date: "May 10, 2025",
                location: "Room 101",
                time: "14:00"
            },
            // More experiences...
        ],
        courses: [] // Empty courses array to avoid template errors
    }
}
```

The `type: 2` parameter tells the email.ejs template to include the email_courses.ejs template, which is designed to display the selected experiences.

## Email Template Styling

The email template is styled to match the confirmation page in the frontend:
- Blue background (#00A4E4)
- White text
- Experience cards with darker blue background (#0082b6)
- Yellow text for experience details

## Language Support

The implementation supports both English and Italian languages:
- The language is determined from the request URL path or query parameter
- The appropriate language template is used for the email
- The email subject is localized based on the language

## Maintenance

To maintain the email sending functionality:

1. Regularly check the server logs for any errors related to email sending
2. Update the email templates as needed to match the frontend styling
3. Test the email sending functionality after any changes to the server.js file
4. Keep the SMTP server credentials up to date

## Future Improvements

Potential future improvements to the email sending functionality:

1. Add support for more languages
2. Improve error handling and retry logic for failed email sending
3. Add tracking for email opens and clicks
4. Add support for HTML and plain text email formats