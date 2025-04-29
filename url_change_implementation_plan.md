# Piano di implementazione per il cambio URL da "/front" a "/opendays"

## Obiettivo
Modificare l'URL dell'applicazione da "/front" a "/opendays" mantenendo tutte le funzionalità esistenti.

## Analisi della situazione attuale
Attualmente, l'applicazione utilizza i seguenti percorsi:
- `/front` (reindirizza a `/en/front`)
- `/en/front`
- `/it/front`
- `/en/front/confirmation`
- `/it/front/confirmation`

Questi percorsi sono gestiti sia lato server (in server.js) che lato client (nei componenti React).

## File da modificare

### 1. server.js
```javascript
// Attuale
app.get(['/en/front', '/it/front', '/front'], (req, res) => {
    if (req.path === '/front') {
        return res.redirect('/en/front');
    }
    res.sendFile(path.join(__dirname, 'front/dist/index.html'));
});

// Da modificare in
app.get(['/en/opendays', '/it/opendays', '/opendays'], (req, res) => {
    if (req.path === '/opendays') {
        return res.redirect('/en/opendays');
    }
    res.sendFile(path.join(__dirname, 'front/dist/index.html'));
});
```

### 2. front/src/App.tsx
```typescript
// Attuale - DefaultRedirect
const DefaultRedirect = () => {
  const location = useLocation();
  return <Navigate to={`/en/front${location.search}`} replace />;
};

// Da modificare in
const DefaultRedirect = () => {
  const location = useLocation();
  return <Navigate to={`/en/opendays${location.search}`} replace />;
};

// Attuale - Routes
<Routes>
  <Route path="/" element={<DefaultRedirect />} />
  <Route
    path="/:lang/front"
    element={
      <LanguageProvider>
        <OpenDayRegistration />
      </LanguageProvider>
    }
  />
  <Route
    path="/:lang/front/confirmation"
    element={<ConfirmationPageWrapper />}
  />
</Routes>

// Da modificare in
<Routes>
  <Route path="/" element={<DefaultRedirect />} />
  <Route
    path="/:lang/opendays"
    element={
      <LanguageProvider>
        <OpenDayRegistration />
      </LanguageProvider>
    }
  />
  <Route
    path="/:lang/opendays/confirmation"
    element={<ConfirmationPageWrapper />}
  />
</Routes>
```

### 3. front/src/components/LanguageSwitcher.tsx
```typescript
// Attuale
const switchLanguage = (newLang: string) => {
  if (newLang !== lang) {
    // Preserve query parameters when switching languages
    navigate(`/${newLang}/front${location.search}`, { replace: true });
  }
};

// Da modificare in
const switchLanguage = (newLang: string) => {
  if (newLang !== lang) {
    // Preserve query parameters when switching languages
    navigate(`/${newLang}/opendays${location.search}`, { replace: true });
  }
};
```

### 4. front/src/components/OpenDayRegistration.tsx
```typescript
// Attuale
// Navigate to the confirmation page with the selected activities
console.log('Navigation to confirmation page with contactID:', contactID);
navigate(`/${lang}/front/confirmation?contactID=${contactID}`, { state: { activities: selectedActivities } });

// Da modificare in
// Navigate to the confirmation page with the selected activities
console.log('Navigation to confirmation page with contactID:', contactID);
navigate(`/${lang}/opendays/confirmation?contactID=${contactID}`, { state: { activities: selectedActivities } });
```

## Piano di test

1. **Test di reindirizzamento base**:
   - Accedere a `/opendays` e verificare che venga reindirizzato a `/en/opendays`
   - Accedere a `/en/opendays` e verificare che venga caricata correttamente la pagina principale
   - Accedere a `/it/opendays` e verificare che venga caricata correttamente la pagina principale in italiano

2. **Test del selettore di lingua**:
   - Accedere a `/en/opendays` e cambiare la lingua in italiano, verificare che l'URL diventi `/it/opendays`
   - Accedere a `/it/opendays` e cambiare la lingua in inglese, verificare che l'URL diventi `/en/opendays`

3. **Test del flusso di registrazione**:
   - Completare il processo di registrazione e verificare che la navigazione alla pagina di conferma funzioni correttamente
   - Verificare che l'URL della pagina di conferma sia `/:lang/opendays/confirmation`

4. **Test di compatibilità con i parametri di query**:
   - Accedere a `/opendays?contactID=123` e verificare che il reindirizzamento mantenga i parametri di query
   - Accedere a `/en/opendays?contactID=123` e cambiare la lingua, verificare che i parametri di query vengano mantenuti

## Considerazioni aggiuntive

1. **Compatibilità con i link esistenti**:
   - Potrebbe essere utile mantenere temporaneamente anche i vecchi percorsi `/front`, `/en/front`, e `/it/front` con un reindirizzamento ai nuovi percorsi per garantire che eventuali link esistenti continuino a funzionare.

2. **Aggiornamento della documentazione**:
   - Aggiornare qualsiasi documentazione interna o esterna che faccia riferimento ai vecchi percorsi.

3. **Notifica agli utenti**:
   - Considerare se è necessario informare gli utenti del cambio di URL, specialmente se hanno salvato dei link nei preferiti.

## Passaggi di implementazione

1. Creare un branch di sviluppo per le modifiche
2. Implementare le modifiche nei file indicati
3. Testare localmente tutte le funzionalità
4. Eseguire i test pianificati
5. Fare il merge del branch nella main/master
6. Distribuire le modifiche in produzione