/**
 * Script per pushare tutte le modifiche della soluzione in due fasi su Git
 */
const { execSync } = require('child_process');
const path = require('path');

// Configurazione
const COMMIT_MESSAGE = 'Aggiornamento generale: push di tutte le modifiche';
const BRANCH_NAME = 'fix/two-phase-slot-selection';

/**
 * Funzione principale per pushare le modifiche su Git
 */
function pushChangesToGit() {
    try {
        console.log('Inizio push delle modifiche su Git...');
        
        // Verifica se Git è installato
        try {
            execSync('git --version', { stdio: 'inherit' });
            console.log('Git è installato correttamente');
        } catch (error) {
            console.error('Git non è installato o non è disponibile nel PATH');
            process.exit(1);
        }
        
        // Verifica se siamo in una repository Git
        try {
            execSync('git rev-parse --is-inside-work-tree', { stdio: 'pipe' });
            console.log('Siamo in una repository Git');
        } catch (error) {
            console.error('Non siamo in una repository Git');
            process.exit(1);
        }
        
        // Crea un nuovo branch per le modifiche
        try {
            execSync(`git checkout -b ${BRANCH_NAME}`, { stdio: 'inherit' });
            console.log(`Creato e selezionato il branch '${BRANCH_NAME}'`);
        } catch (error) {
            // Se il branch esiste già, selezionalo
            console.log(`Il branch '${BRANCH_NAME}' potrebbe già esistere, provo a selezionarlo`);
            try {
                execSync(`git checkout ${BRANCH_NAME}`, { stdio: 'inherit' });
                console.log(`Selezionato il branch esistente '${BRANCH_NAME}'`);
            } catch (checkoutError) {
                console.error(`Errore nel selezionare il branch '${BRANCH_NAME}': ${checkoutError.message}`);
                process.exit(1);
            }
        }
        
        // Aggiungi tutti i file modificati
        console.log('Aggiungo tutti i file modificati...');
        try {
            execSync('git add .', { stdio: 'inherit' });
            console.log('Aggiunti tutti i file modificati');
        } catch (error) {
            console.error(`Errore nell'aggiungere i file: ${error.message}`);
            process.exit(1);
        }
        
        // Commit delle modifiche
        try {
            execSync(`git commit -m "${COMMIT_MESSAGE}"`, { stdio: 'inherit' });
            console.log('Commit delle modifiche effettuato');
        } catch (error) {
            console.error(`Errore nel commit delle modifiche: ${error.message}`);
            process.exit(1);
        }
        
        // Push delle modifiche
        try {
            execSync(`git push -u origin ${BRANCH_NAME}`, { stdio: 'inherit' });
            console.log(`Push delle modifiche effettuato sul branch '${BRANCH_NAME}'`);
        } catch (error) {
            console.error(`Errore nel push delle modifiche: ${error.message}`);
            console.log('Potrebbe essere necessario pushare manualmente con:');
            console.log(`git push -u origin ${BRANCH_NAME}`);
            process.exit(1);
        }
        
        console.log('\nPush delle modifiche completato con successo!');
        console.log(`Le modifiche sono state pushate sul branch '${BRANCH_NAME}'`);
        console.log('Ora puoi creare una Pull Request per integrare le modifiche nel branch principale');
        
    } catch (error) {
        console.error('Errore durante il push delle modifiche:', error.message);
        process.exit(1);
    }
}

// Esegui la funzione principale
pushChangesToGit();