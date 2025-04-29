# QR Code Integration Plan

## Current State
1. The front-end ConfirmationPage component (in `front/src/components/ConfirmationPage.tsx`) currently displays a hardcoded QR code image at `/images/qr.png`.
2. The backend already has QR code generation capability using the `qrcode` npm package.
3. The backend generates QR codes in two places in `server.js`, but there's no dedicated API endpoint for generating QR codes on demand.
4. The backend saves generated QR codes to the `/public/qrimg/` directory with unique filenames.
5. The backend has a function `getContactDetails(contactId)` in `courseExperienceService.js` that can retrieve contact information needed for QR code generation.

## Required Changes

### 1. Create a New API Endpoint for QR Code Generation
We need to create a new API endpoint in the backend that:
- Accepts a contact ID
- Generates a QR code for that contact
- Returns the QR code image or its URL

### 2. Update the Front-end to Use the New API
We need to modify the ConfirmationPage component to:
- Call the new API endpoint with the user's contact ID
- Display the dynamically generated QR code instead of the hardcoded one

## Implementation Plan

### Backend Changes

1. **Create a new API endpoint in server.js**:
   ```javascript
   // API endpoint to generate QR code for a contact
   app.get('/api/generate-qr/:contactID', async (req, res) => {
     try {
       const contactID = req.params.contactID;
       
       // Get contact details
       const contact = await courseExperienceService.getContactDetails(contactID);
       
       // Generate QR code content (same as existing implementation)
       const text2encode = contact.email + '**' + contactID;
       const encoded = xorCipher.encode(text2encode, xorKey);
       
       // Generate QR code
       QRCode.toDataURL(encoded, (err, qrCode) => {
         if (err) {
           logger.error('Error generating QR code:', err);
           return res.status(500).json({ error: 'Error generating QR code' });
         }
         
         // Generate a unique filename
         const qrFileName = `${uuidv4()}.png`;
         const qrFilePath = path.join(__dirname, 'public', 'qrimg', qrFileName);
         const qrBuffer = Buffer.from(qrCode.split(',')[1], 'base64');
         
         // Save the QR code to a file
         fs.writeFile(qrFilePath, qrBuffer, (err) => {
           if (err) {
             logger.error('Error saving QR code image:', err);
             return res.status(500).json({ error: 'Error saving QR code' });
           }
           
           // Return the URL to the QR code
           const qrCodeUrl = `/qrimg/${qrFileName}`;
           res.json({ qrCodeUrl });
         });
       });
     } catch (error) {
       logger.error('Error in /api/generate-qr:', error);
       res.status(500).json({ error: 'Internal server error' });
     }
   });
   ```

2. **Ensure the `/public/qrimg/` directory exists**:
   ```javascript
   // Ensure the qrimg directory exists
   const qrImgDir = path.join(__dirname, 'public', 'qrimg');
   if (!fs.existsSync(qrImgDir)) {
     fs.mkdirSync(qrImgDir, { recursive: true });
   }
   ```

### Frontend Changes

1. **Update the experienceService.ts to add a function for fetching QR codes**:
   ```typescript
   /**
    * Fetches a QR code for a contact
    * @param contactID The ID of the contact
    * @returns Promise with the URL to the QR code
    */
   export const fetchQRCode = async (contactID: string): Promise<string> => {
     try {
       const response = await fetch(`http://localhost:3000/api/generate-qr/${contactID}`);
       
       if (!response.ok) {
         console.error('API response not OK:', response.status, response.statusText);
         throw new Error('Failed to fetch QR code');
       }
       
       const data = await response.json();
       return data.qrCodeUrl;
     } catch (error) {
       console.error('Error fetching QR code:', error);
       return '/images/qr.png'; // Fallback to the static image
     }
   };
   ```

2. **Update the ConfirmationPage.tsx component to use the dynamic QR code**:
   ```tsx
   import React, { useEffect, useState } from 'react';
   import { useTranslation } from 'react-i18next';
   import { useLocation } from 'react-router-dom';
   import { fetchQRCode } from '../services/experienceService';

   interface SelectedActivity {
     activity?: string;
     course?: string;
     time?: string;
   }

   interface ConfirmationPageProps {
     activities: SelectedActivity[];
     contactID?: string; // Add contactID prop
   }

   export const ConfirmationPage = ({ activities, contactID }: ConfirmationPageProps) => {
     const { t } = useTranslation();
     const [qrCodeUrl, setQrCodeUrl] = useState<string>('/images/qr.png'); // Default to static image
     
     useEffect(() => {
       // Fetch QR code if contactID is provided
       if (contactID) {
         fetchQRCode(contactID)
           .then(url => setQrCodeUrl(url))
           .catch(error => console.error('Error fetching QR code:', error));
       }
     }, [contactID]);
     
     return (
       <main className="min-h-screen bg-[#00A4E4] w-full">
         <div className="max-w-4xl mx-auto py-12 px-4">
           <h1 className="text-6xl font-viridian text-white tracking-wide leading-tight text-center mb-12">
             {t('welcomeToOpenDays')}
           </h1>
           <div className="max-w-lg mx-auto">
             <div className="text-center text-white text-xl mb-8 font-bold">
               {t('emailRecapSent')}
             </div>
             <div className="bg-white p-8 rounded-lg shadow-lg mb-12">
               <img
                 src={qrCodeUrl}
                 alt="QR Code"
                 className="w-full aspect-square object-contain"
               />
             </div>
             {/* Rest of the component remains the same */}
           </div>
         </div>
       </main>
     );
   };
   ```

3. **Update any parent components that render ConfirmationPage to pass the contactID prop**

## Considerations and Potential Issues

1. **Error Handling**: Both the backend and frontend implementations include error handling to gracefully degrade to the static QR code if there's an issue.

2. **Directory Creation**: We ensure the `/public/qrimg/` directory exists before trying to save files there.

3. **QR Code Cleanup**: Over time, many QR code images will accumulate in the `/public/qrimg/` directory. A cleanup mechanism might be needed in the future.

4. **Security**: The QR code contains sensitive information (email + contactID) that is encoded using XOR cipher. This is consistent with the existing implementation.

5. **Performance**: QR codes are generated on-demand and cached as files, which is efficient for repeated access.

## Testing Plan

1. Implement the backend API endpoint
2. Test the endpoint directly using a tool like Postman or curl
3. Implement the frontend changes
4. Test the integration by navigating to the confirmation page with a valid contactID