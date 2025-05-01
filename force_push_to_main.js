/**
 * Script per pushare tutte le modifiche direttamente sul branch main usando force push
 */
const { execSync } = require('child_process');

/**
 * Funzione principale per pushare le modifiche su Git
 */
function forcePushToMain() {
    try {
        console.log('Inizio force push delle modifiche sul branch main...');
        
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
            execSync(`git commit -m "Aggiornamento generale: push di tutte le modifiche"`, { stdio: 'inherit' });
            console.log('Modifiche locali committate');
        } catch (error) {
            console.log('Nessuna modifica locale da committare o errore nel commit');
        }
        
        // Ottieni il nome del branch corrente
        let currentBranch;
        try {
            currentBranch = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' }).trim();
            console.log(`Branch corrente: ${currentBranch}`);
        } catch (error) {
            console.error(`Errore nell'ottenere il nome del branch corrente: ${error.message}`);
            process.exit(1);
        }
        
        // Force push del branch corrente su main
        console.log('Force push del branch corrente su main...');
        try {
            execSync(`git push origin ${currentBranch}:main --force`, { stdio: 'inherit' });
            console.log('Force push completato con successo');
        } catch (error) {
            console.error(`Errore nel force push: ${error.message}`);
            process.exit(1);
        }
        
        console.log('\nPush delle modifiche completato con successo!');
        console.log(`Le modifiche sono state pushate sul branch 'main'`);
        console.log('NOTA: Questo è stato un force push, che ha sovrascritto la storia del branch main.');
        
    } catch (error) {
        console.error('Errore durante il push delle modifiche:', error.message);
        process.exit(1);
    }
}

// Esegui la funzione principale
forcePushToMain();