# Piano per Rimuovere i Pulsanti di Cambio Lingua

Basandomi sull'analisi del codice, ecco un piano dettagliato per rimuovere i pulsanti di cambio lingua e il codice relativo, mantenendo comunque la funzionalità di internazionalizzazione con URL specifici per lingua.

## 1. Modifiche al Componente OpenDayRegistration

Dobbiamo rimuovere l'importazione e l'uso del componente LanguageSwitcher:

```typescript
// Rimuovere questa importazione
import { LanguageSwitcher } from './LanguageSwitcher';

// E rimuovere questo elemento dal JSX
<LanguageSwitcher />
```

## 2. Gestione del Componente LanguageSwitcher

Possiamo eliminare completamente il file `LanguageSwitcher.tsx` poiché non sarà più utilizzato.

## 3. Mantenere il LanguageProvider

Il componente `LanguageProvider` deve essere mantenuto poiché è ancora necessario per impostare la lingua in base all'URL.

## 4. Mantenere il Routing in App.tsx

Il routing in `App.tsx` deve essere mantenuto poiché è ancora necessario per gestire le route specifiche per lingua.

## 5. Mantenere i File di Traduzione

I file di traduzione in `locales/en/translation.json` e `locales/it/translation.json` devono essere mantenuti poiché sono ancora necessari per la traduzione dei contenuti.

## Diagramma delle Modifiche

```mermaid
graph TD
    A[OpenDayRegistration.tsx] -->|Rimuovere importazione e uso| B[LanguageSwitcher]
    C[LanguageSwitcher.tsx] -->|Eliminare file| D[Non più necessario]
    E[LanguageProvider.tsx] -->|Mantenere| F[Necessario per impostare lingua da URL]
    G[App.tsx] -->|Mantenere| H[Necessario per routing]
    I[Traduzioni] -->|Mantenere| J[Necessarie per contenuti]