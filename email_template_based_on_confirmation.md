# Template Email Basato sulla Pagina di Conferma

Come richiesto, ho creato un nuovo template per le email basato sulla pagina di conferma in `/front/src/components/ConfirmationPage.tsx`. Questo template utilizza lo stesso layout e gli stessi dati della pagina di conferma.

## Struttura del Template

Il template è strutturato in modo da mostrare:
1. Un titolo di benvenuto
2. Il QR code
3. La lista dei corsi corrispondenti
4. La lista delle attività selezionate
5. Il logo UniSR

## Codice HTML del Template

Ecco il codice HTML del template che puoi utilizzare per sostituire il contenuto di `views/en/email_courses.ejs` e `views/it/email_courses.ejs`:

```html
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="<%= language === 'en' ? 'en' : 'it' %>">
  <head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Open Day Registration Confirmed</title>
    <style type="text/css">
      @font-face {
        font-family: "Poppins";
        src: url("https://changemakers.unisr.org/fonts/Poppins-Regular.ttf") format("truetype");
        font-weight: 400;
        font-style: normal;
      }
      @font-face {
        font-family: "Poppins";
        src: url("https://changemakers.unisr.org/fonts/Poppins-Medium.ttf") format("truetype");
        font-weight: 500;
        font-style: normal;
      }
      @font-face {
        font-family: "Poppins";
        src: url("https://changemakers.unisr.org/fonts/Poppins-SemiBold.ttf") format("truetype");
        font-weight: 600;
        font-style: normal;
      }
      body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
      table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
      img { -ms-interpolation-mode: bicubic; }
      img { border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
      table { border-collapse: collapse !important; }
      body { height: 100% !important; margin: 0 !important; padding: 0 !important; width: 100% !important; }
      a[x-apple-data-detectors] { color: inherit !important; text-decoration: none !important; font-size: inherit !important; font-family: inherit !important; font-weight: inherit !important; line-height: inherit !important; }
      
      .main-bg { background-color: #00A4E4; }
      .card-bg { background-color: #0082b6; }
      .text-white { color: #FFFFFF; }
      .text-yellow { color: #FFDD00; }
      .font-bold { font-weight: bold; }
      .text-center { text-align: center; }
      .rounded { border-radius: 8px; }
      .shadow { box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
      .p-6 { padding: 24px; }
      .p-8 { padding: 32px; }
      .mb-2 { margin-bottom: 8px; }
      .mb-4 { margin-bottom: 16px; }
      .mb-8 { margin-bottom: 32px; }
      .mb-12 { margin-bottom: 48px; }
      .mb-16 { margin-bottom: 64px; }
      .mt-2 { margin-top: 8px; }
      .mx-auto { margin-left: auto; margin-right: auto; }
      .w-full { width: 100%; }
      .max-w-lg { max-width: 32rem; }
      
      @media screen and (max-width: 525px) {
        .wrapper { width: 100% !important; max-width: 100% !important; }
        .responsive-table { width: 100% !important; }
        .padding { padding: 10px 5% 15px 5% !important; }
        .section-padding { padding: 0 15px 50px 15px !important; }
        .mobile-title { font-size: 24px !important; }
      }
    </style>
  </head>
  <body style="margin: 0 !important; padding: 0 !important; background-color: #00A4E4; color: #FFFFFF;">
    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed;">
      <tr>
        <td bgcolor="#00A4E4" align="center" style="padding: 45px 15px 45px 15px;">
          <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px;" class="responsive-table">
            <tr>
              <td>
                <!-- Header -->
                <table width="100%" border="0" cellspacing="0" cellpadding="0">
                  <tr>
                    <td align="center" style="font-family: 'Poppins', sans-serif; font-size: 36px; font-weight: 700; color: #FFFFFF; padding-bottom: 30px;" class="mobile-title">
                      <%= language === 'en' ? 'Welcome to Open Days' : 'Benvenuto agli Open Days' %>
                    </td>
                  </tr>
                  <tr>
                    <td align="center" style="font-family: 'Poppins', sans-serif; font-size: 18px; font-weight: 600; color: #FFFFFF; padding-bottom: 30px;">
                      <%= language === 'en' ? 'Your registration has been confirmed' : 'La tua registrazione è stata confermata' %>
                    </td>
                  </tr>
                </table>
                
                <!-- QR Code Section -->
                <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 40px;">
                  <tr>
                    <td align="center">
                      <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 300px; margin: 0 auto;">
                        <tr>
                          <td bgcolor="#FFFFFF" align="center" style="padding: 30px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                            <% if (typeof qrCode !== 'undefined' && qrCode) { %>
                              <img src="https://zaini.unisr.org/<%= qrCode %>" width="240" height="240" border="0" alt="QR Code" style="display: block; width: 240px; height: 240px; max-width: 240px;">
                            <% } else { %>
                              <div style="width: 240px; height: 240px; background-color: #f0f0f0; display: flex; align-items: center; justify-content: center; color: #666666; font-family: 'Poppins', sans-serif;">
                                QR Code not available
                              </div>
                            <% } %>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
                
                <!-- Courses Section -->
                <% if (typeof fieldData !== 'undefined' && fieldData.courses && fieldData.courses.length > 0) { %>
                <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 40px;">
                  <tr>
                    <td align="center" style="font-family: 'Poppins', sans-serif; font-size: 24px; font-weight: 700; color: #FFFFFF; padding-bottom: 20px;">
                      <%= language === 'en' ? 'Your Courses' : 'I tuoi Corsi' %>
                    </td>
                  </tr>
                  <% fieldData.courses.forEach(course => { %>
                  <tr>
                    <td style="padding-bottom: 16px;">
                      <table width="100%" border="0" cellspacing="0" cellpadding="0">
                        <tr>
                          <td bgcolor="#0082b6" style="padding: 24px; border-radius: 8px;">
                            <table width="100%" border="0" cellspacing="0" cellpadding="0">
                              <tr>
                                <td style="font-family: 'Poppins', sans-serif; font-size: 18px; font-weight: 700; color: #FFFFFF; padding-bottom: 8px;">
                                  <%= course.title %>
                                </td>
                              </tr>
                              <tr>
                                <td>
                                  <table width="100%" border="0" cellspacing="0" cellpadding="0">
                                    <tr>
                                      <td style="font-family: 'Poppins', sans-serif; font-size: 14px; font-weight: 600; color: #FFDD00; padding-bottom: 4px;">
                                        <%= language === 'en' ? 'Location' : 'Luogo' %>: <%= course.location || (language === 'en' ? 'Not available' : 'Non disponibile') %>
                                      </td>
                                    </tr>
                                    <tr>
                                      <td style="font-family: 'Poppins', sans-serif; font-size: 14px; font-weight: 600; color: #FFDD00;">
                                        <%= language === 'en' ? 'Date' : 'Data' %>: <%= course.date || (language === 'en' ? 'Not available' : 'Non disponibile') %>
                                      </td>
                                    </tr>
                                  </table>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  <% }); %>
                </table>
                <% } %>
                
                <!-- Frontali Section -->
                <% if (typeof fieldData !== 'undefined' && fieldData.frontali && fieldData.frontali.length > 0) { %>
                <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 40px;">
                  <tr>
                    <td align="center" style="font-family: 'Poppins', sans-serif; font-size: 24px; font-weight: 700; color: #FFFFFF; padding-bottom: 20px;">
                      <%= language === 'en' ? 'Lecture Experiences' : 'Esperienze di Lezione' %>
                    </td>
                  </tr>
                  <% fieldData.frontali.forEach(exp => { %>
                  <tr>
                    <td style="padding-bottom: 16px;">
                      <table width="100%" border="0" cellspacing="0" cellpadding="0">
                        <tr>
                          <td bgcolor="#0082b6" style="padding: 24px; border-radius: 8px;">
                            <table width="100%" border="0" cellspacing="0" cellpadding="0">
                              <tr>
                                <td style="font-family: 'Poppins', sans-serif; font-size: 18px; font-weight: 700; color: #FFFFFF; padding-bottom: 8px;">
                                  <%= exp.title %>
                                </td>
                              </tr>
                              <tr>
                                <td>
                                  <table width="100%" border="0" cellspacing="0" cellpadding="0">
                                    <% if (exp.location) { %>
                                    <tr>
                                      <td style="font-family: 'Poppins', sans-serif; font-size: 14px; font-weight: 600; color: #FFDD00; padding-bottom: 4px;">
                                        <%= language === 'en' ? 'Location' : 'Luogo' %>: <%= exp.location %>
                                      </td>
                                    </tr>
                                    <% } %>
                                    <% if (exp.date) { %>
                                    <tr>
                                      <td style="font-family: 'Poppins', sans-serif; font-size: 14px; font-weight: 600; color: #FFDD00;">
                                        <%= language === 'en' ? 'Date' : 'Data' %>: <%= exp.date %>
                                      </td>
                                    </tr>
                                    <% } %>
                                  </table>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  <% }); %>
                </table>
                <% } %>
                
                <!-- Experiences Section -->
                <% if (typeof fieldData !== 'undefined' && fieldData.experiences && fieldData.experiences.length > 0) { %>
                <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 40px;">
                  <tr>
                    <td align="center" style="font-family: 'Poppins', sans-serif; font-size: 24px; font-weight: 700; color: #FFFFFF; padding-bottom: 20px;">
                      <%= language === 'en' ? 'Your Activities' : 'Le tue Attività' %>
                    </td>
                  </tr>
                  <% fieldData.experiences.forEach(exp => { %>
                  <tr>
                    <td style="padding-bottom: 16px;">
                      <table width="100%" border="0" cellspacing="0" cellpadding="0">
                        <tr>
                          <td bgcolor="#0082b6" style="padding: 24px; border-radius: 8px;">
                            <table width="100%" border="0" cellspacing="0" cellpadding="0">
                              <tr>
                                <td style="font-family: 'Poppins', sans-serif; font-size: 18px; font-weight: 700; color: #FFFFFF; padding-bottom: 8px;">
                                  <%= exp.title %>
                                </td>
                              </tr>
                              <tr>
                                <td>
                                  <table width="100%" border="0" cellspacing="0" cellpadding="0">
                                    <tr>
                                      <td style="font-family: 'Poppins', sans-serif; font-size: 14px; font-weight: 600; color: #FFDD00; padding-bottom: 4px;">
                                        <%= language === 'en' ? 'Location' : 'Luogo' %>: <%= exp.location || (language === 'en' ? 'Not available' : 'Non disponibile') %>
                                      </td>
                                    </tr>
                                    <tr>
                                      <td style="font-family: 'Poppins', sans-serif; font-size: 14px; font-weight: 600; color: #FFDD00;">
                                        <%= language === 'en' ? 'Date' : 'Data' %>: <%= exp.date || (language === 'en' ? 'Not available' : 'Non disponibile') %>
                                      </td>
                                    </tr>
                                    <% if (exp.time) { %>
                                    <tr>
                                      <td style="font-family: 'Poppins', sans-serif; font-size: 14px; font-weight: 600; color: #FFDD00; padding-top: 4px;">
                                        <%= language === 'en' ? 'Time' : 'Orario' %>: <%= exp.time %>
                                      </td>
                                    </tr>
                                    <% } %>
                                  </table>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  <% }); %>
                </table>
                <% } else { %>
                <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 40px;">
                  <tr>
                    <td align="center" style="font-family: 'Poppins', sans-serif; font-size: 16px; font-weight: 400; color: #FFFFFF; padding: 15px 0;">
                      <%= language === 'en' ? 'No activities selected.' : 'Nessuna attività selezionata.' %>
                    </td>
                  </tr>
                </table>
                <% } %>
                
                <!-- Footer -->
                <table width="100%" border="0" cellspacing="0" cellpadding="0">
                  <tr>
                    <td align="center" style="padding-top: 20px;">
                      <img src="https://uploadthingy.s3.us-west-1.amazonaws.com/w1w55NpM45wFShyM85TXCC/Group_96.svg" alt="UniSR Logo" width="120" style="display: block; width: 120px; height: auto;">
                    </td>
                  </tr>
                  <tr>
                    <td align="center" style="font-family: 'Poppins', sans-serif; font-size: 14px; color: #FFFFFF; padding-top: 20px;">
                      <%= language === 'en' ? 'For any information, please contact us at' : 'Per qualsiasi informazione, contattaci a' %> <a href="mailto:info.unisr@unisr.it" style="color: #FFFFFF; text-decoration: underline;">info.unisr@unisr.it</a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
```

## Istruzioni per l'Implementazione

Per implementare questo template:

1. Crea un nuovo file `views/en/email_courses_new.ejs` e copia il codice HTML sopra
2. Crea un nuovo file `views/it/email_courses_new.ejs` e copia lo stesso codice HTML
3. Modifica il file `views/en/email.ejs` e `views/it/email.ejs` per includere il nuovo template:

```ejs
<%
// This file is a patch for the email.ejs file
// Adds support for the new email type (type: 2) for the registration mode with courses and experiences
// To apply the patch, replace the content of the email.ejs file with the following code:

// Check the email type
if (typeof type !== 'undefined' && type === 2) {
    // Type 2: Email for the new registration mode with courses and experiences
    // Redirect to the new email_courses_new.ejs template
    include('email_courses_new');
} else {
    // Type 1 or unspecified: Email for the existing registration mode
    // Keep the existing code
%>
<!-- Existing email template code -->
<% } %>
```

4. Assicurati che i dati passati al template includano tutti i campi necessari:

```javascript
const emailData = {
    name: contact.firstname,
    email: contact.email,
    qrCode: qrCodeUrl,
    type: 2, // Use email_courses_new.ejs template
    language: language, // 'en' or 'it'
    fieldData: {
        courses: [], // Array of courses
        experiences: validExperiences, // Array of experiences
        frontali: [] // Array of frontali experiences
    }
};
```

Questo template è progettato per essere responsive e funzionare bene su dispositivi mobili e desktop. Utilizza colori e stili simili alla pagina di conferma in React, ma è ottimizzato per l'invio via email.