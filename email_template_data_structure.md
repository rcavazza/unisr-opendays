# Struttura Dati per il Template Email

## Riferimento: Pagina di Conferma

Come indicato, il riferimento è la pagina di conferma (`ConfirmationPage.tsx`) che attualmente funziona e ha tutti i dati necessari. Analizziamo la sua struttura dati per replicarla nel template email.

### Struttura Dati della Pagina di Conferma

Il componente `ConfirmationPage.tsx` riceve i seguenti props:

```typescript
interface ConfirmationPageProps {
  activities: SelectedActivity[];
  contactID?: string;
  matchingCourseIds?: string[];
}

interface SelectedActivity {
  activity?: string;
  course?: string;
  time?: string;
  location?: string;
  duration?: string;
}
```

All'interno del componente, vengono recuperati i corsi corrispondenti da un file JSON:

```typescript
// Fetch matching courses from corsi.json
useEffect(() => {
  if (matchingCourseIds.length > 0) {
    const fetchCourses = async () => {
      try {
        const response = await fetch('/corsi.json');
        if (!response.ok) {
          console.error('Failed to fetch courses:', response.statusText);
          return;
        }
        
        const allCourses: Course[] = await response.json();
        
        // Filter courses by matching IDs
        const courses = allCourses.filter(course =>
          matchingCourseIds.includes(course.id)
        );
        
        console.log('Matching courses:', courses);
        setMatchingCourses(courses);
      } catch (error) {
        console.error('Error fetching courses:', error);
      }
    };
    
    fetchCourses();
  }
}, [matchingCourseIds]);
```

### Struttura Dati Necessaria per il Template Email

Per replicare la stessa struttura nel template email, dobbiamo passare:

1. **QR Code URL**: URL dell'immagine del QR code
2. **Corsi**: Array di corsi corrispondenti
3. **Attività**: Array di attività selezionate

La struttura dati completa dovrebbe essere:

```javascript
const emailData = {
  name: contact.firstname,
  email: contact.email,
  qrCode: qrCodeUrl,
  type: 2, // Use email_courses.ejs template
  language: language, // 'en' o 'it'
  fieldData: {
    courses: matchingCourses.map(course => ({
      title: course.name,
      date: "May 10, 2025", // Data fissa per l'Open Day
      location: course.location || "Main Campus",
      time: course.orario_inizio ? `${course.orario_inizio}${course.orario_fine ? ' - ' + course.orario_fine : ''}` : ''
    })),
    experiences: validExperiences.map(exp => ({
      title: exp.title || exp.activity,
      date: "May 10, 2025", // Data fissa per l'Open Day
      location: exp.location || "Main Campus",
      time: exp.time || ''
    })),
    frontali: [] // Se non ci sono esperienze frontali, lasciare vuoto
  }
};
```

## Implementazione

Per implementare questa soluzione, dobbiamo modificare le funzioni `sendEmailWithQR` e `sendEmailWithoutQR` nel file `server.js`:

```javascript
// Function to send email with QR code that returns a Promise
function sendEmailWithQR(contact, qrCodeUrl, validExperiences, language, matchingCourses = []) {
  return new Promise((resolve, reject) => {
    // Prepare email data with the same structure as the confirmation page
    const emailData = {
      name: contact.firstname,
      email: contact.email,
      qrCode: qrCodeUrl,
      type: 2, // Use email_courses.ejs template
      language: language, // 'en' o 'it'
      fieldData: {
        courses: matchingCourses.map(course => ({
          title: course.name || course.title,
          date: "May 10, 2025", // Data fissa per l'Open Day
          location: course.location || "Main Campus",
          time: course.orario_inizio ? `${course.orario_inizio}${course.orario_fine ? ' - ' + course.orario_fine : ''}` : ''
        })),
        experiences: validExperiences.map(exp => ({
          title: exp.title || exp.activity,
          date: "May 10, 2025", // Data fissa per l'Open Day
          location: exp.location || "Main Campus",
          time: exp.time || ''
        })),
        frontali: [] // Se non ci sono esperienze frontali, lasciare vuoto
      }
    };
    
    // ... resto del codice ...
  });
}

// Function to send email without QR code that returns a Promise
function sendEmailWithoutQR(contact, validExperiences, language, matchingCourses = []) {
  return new Promise((resolve, reject) => {
    // Similar to sendEmailWithQR but without the QR code
    const emailData = {
      name: contact.firstname,
      email: contact.email,
      type: 2, // Use email_courses.ejs template
      language: language, // 'en' o 'it'
      fieldData: {
        courses: matchingCourses.map(course => ({
          title: course.name || course.title,
          date: "May 10, 2025", // Data fissa per l'Open Day
          location: course.location || "Main Campus",
          time: course.orario_inizio ? `${course.orario_inizio}${course.orario_fine ? ' - ' + course.orario_fine : ''}` : ''
        })),
        experiences: validExperiences.map(exp => ({
          title: exp.title || exp.activity,
          date: "May 10, 2025", // Data fissa per l'Open Day
          location: exp.location || "Main Campus",
          time: exp.time || ''
        })),
        frontali: [] // Se non ci sono esperienze frontali, lasciare vuoto
      }
    };
    
    // ... resto del codice ...
  });
}
```

## Recupero dei Corsi

Per recuperare i corsi corrispondenti, dobbiamo aggiungere una funzione che legge il file `corsi.json` e filtra i corsi in base agli ID corrispondenti:

```javascript
// Function to get matching courses from corsi.json
async function getMatchingCourses(matchingCourseIds) {
  try {
    const coursesData = fs.readFileSync(path.join(__dirname, 'front', 'public', 'corsi.json'), 'utf8');
    const allCourses = JSON.parse(coursesData);
    
    // Filter courses by matching IDs
    return allCourses.filter(course => 
      matchingCourseIds.includes(course.id)
    );
  } catch (error) {
    logger.error('Error reading courses data:', error);
    return [];
  }
}
```

## Chiamata alle Funzioni

Infine, dobbiamo modificare la chiamata alle funzioni `sendEmailWithQR` e `sendEmailWithoutQR` per passare anche i corsi corrispondenti:

```javascript
// Parse experienceIds to ensure it's an array
const expIds = Array.isArray(experienceIds) ? experienceIds : experiencesString.split(';');

// Get matching courses
const matchingCourses = await getMatchingCourses(expIds);

// Generate and save QR code
const qrCode = await generateQRCode(encoded);
try {
  // Save QR code to file
  const qrCodeUrl = await saveQRCodeToFile(qrCode);
  // Send email with QR code
  await sendEmailWithQR(contact, qrCodeUrl, validExperiences, language, matchingCourses);
} catch (saveError) {
  logger.error('Error saving QR code:', saveError);
  // If saving QR code fails, send email without QR code
  await sendEmailWithoutQR(contact, validExperiences, language, matchingCourses);
}
```

## Conclusione

Con queste modifiche, il template email riceverà gli stessi dati che vengono passati alla pagina di conferma, garantendo che l'email abbia lo stesso aspetto e contenuto della pagina web. Questo approccio è più robusto e manutenibile, poiché mantiene la coerenza tra l'email e la pagina web.