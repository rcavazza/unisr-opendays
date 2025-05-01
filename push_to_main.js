/**
 * Script per pushare tutte le modifiche sul branch main
 */
const { execSync } = require('child_process');

// Configurazione
const COMMIT_MESSAGE = 'Aggiornamento generale: push di tutte le modifiche';
const SOURCE_BRANCH = 'fix/two-phase-slot-selection';
const TARGET_BRANCH = 'main';

/**
 * Funzione principale per pushare le modifiche su Git
 */
function pushChangesToMain() {
    try {
        console.log('Inizio push delle modifiche sul branch main...');
        
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
        
        // Prima commit le modifiche locali sul branch corrente
        console.log('Commit delle modifiche locali sul branch corrente...');
        try {
            execSync('git add .', { stdio: 'inherit' });
            execSync(`git commit -m "Aggiorna script per push su main"`, { stdio: 'inherit' });
            console.log('Modifiche locali committate');
        } catch (error) {
            console.log('Nessuna modifica locale da committare o errore nel commit');
        }
        
        // Checkout del branch main
        console.log(`Checkout del branch ${TARGET_BRANCH}...`);
        try {
            execSync(`git checkout ${TARGET_BRANCH}`, { stdio: 'inherit' });
            console.log(`Branch ${TARGET_BRANCH} selezionato`);
        } catch (error) {
            console.error(`Errore nel selezionare il branch ${TARGET_BRANCH}: ${error.message}`);
            process.exit(1);
        }
        
        // Merge dal branch source
        console.log(`Merge dal branch ${SOURCE_BRANCH}...`);
        try {
            execSync(`git merge ${SOURCE_BRANCH} --no-ff -m "Merge branch '${SOURCE_BRANCH}' into ${TARGET_BRANCH}"`, { stdio: 'inherit' });
            console.log(`Merge dal branch ${SOURCE_BRANCH} completato`);
        } catch (error) {
            console.error(`Errore nel merge dal branch ${SOURCE_BRANCH}: ${error.message}`);
            console.log('Potrebbe essere necessario risolvere i conflitti manualmente');
            process.exit(1);
        }
        
        // Push delle modifiche
        console.log(`Push delle modifiche sul branch ${TARGET_BRANCH}...`);
        try {
            execSync(`git push origin ${TARGET_BRANCH}`, { stdio: 'inherit' });
            console.log(`Push delle modifiche completato sul branch ${TARGET_BRANCH}`);
        } catch (error) {
            console.error(`Errore nel push delle modifiche: ${error.message}`);
            console.log('Potrebbe essere necessario pushare manualmente con:');
            console.log(`git push origin ${TARGET_BRANCH}`);
            process.exit(1);
        }
        
        console.log('\nPush delle modifiche completato con successo!');
        console.log(`Le modifiche sono state pushate sul branch '${TARGET_BRANCH}'`);
        
    } catch (error) {
        console.error('Errore durante il push delle modifiche:', error.message);
        process.exit(1);
    }
}

// Esegui la funzione principale
pushChangesToMain();