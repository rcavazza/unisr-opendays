# Guida alla Generazione di PDF dai Diagrammi dell'Architettura

Per generare un PDF dai file di architettura che abbiamo creato (`application_architecture.md`), ci sono diverse opzioni disponibili. Ecco i metodi più semplici ed efficaci:

## 1. Utilizzando Pandoc (Metodo Consigliato)

[Pandoc](https://pandoc.org/) è uno strumento da riga di comando molto potente per convertire documenti tra vari formati.

### Installazione di Pandoc

- **Windows**: Scarica l'installer da [pandoc.org/installing.html](https://pandoc.org/installing.html)
- **macOS**: `brew install pandoc`
- **Linux**: `sudo apt-get install pandoc` (Ubuntu/Debian) o `sudo yum install pandoc` (CentOS/RHEL)

### Generazione del PDF

Apri un terminale nella directory del progetto e esegui:

```bash
pandoc application_architecture.md -o architettura_applicazione.pdf --pdf-engine=wkhtmltopdf
```

Per includere i diagrammi Mermaid, è necessario prima renderizzarli come immagini. Puoi utilizzare l'opzione `--filter pandoc-mermaid` se hai installato il filtro pandoc-mermaid:

```bash
npm install -g @mermaid-js/mermaid-cli
pandoc application_architecture.md --filter pandoc-mermaid -o architettura_applicazione.pdf
```

## 2. Utilizzando VS Code con Estensioni

Se stai già utilizzando VS Code, puoi installare estensioni che permettono di esportare in PDF:

1. Installa l'estensione "Markdown PDF" da VS Code Marketplace
2. Apri il file `application_architecture.md`
3. Premi F1 o Ctrl+Shift+P per aprire la palette dei comandi
4. Digita "Markdown PDF: Export (pdf)" e premi Invio

## 3. Utilizzando Browser Web

Un metodo semplice è utilizzare la funzionalità di stampa del browser:

1. Apri il file `application_architecture.md` in un editor che supporta la visualizzazione dei diagrammi Mermaid (come VS Code con l'estensione Markdown Preview Mermaid Support)
2. Utilizza la funzione "Stampa" (Ctrl+P o Cmd+P)
3. Seleziona "Salva come PDF" come stampante
4. Configura le impostazioni di pagina come desideri
5. Clicca su "Salva"

## 4. Utilizzando Servizi Online

Esistono servizi online che possono convertire Markdown in PDF:

1. [Markdown to PDF](https://www.markdowntopdf.com/)
2. [CloudConvert](https://cloudconvert.com/md-to-pdf)
3. [Dillinger](https://dillinger.io/) (permette di importare Markdown e esportare in PDF)

Nota: questi servizi potrebbero non supportare correttamente i diagrammi Mermaid.

## 5. Utilizzando Typora

[Typora](https://typora.io/) è un editor Markdown che supporta l'esportazione in PDF e la visualizzazione dei diagrammi Mermaid:

1. Apri il file `application_architecture.md` in Typora
2. Vai su File > Esporta > PDF
3. Configura le opzioni di esportazione
4. Clicca su "Esporta"

## 6. Utilizzando Obsidian

[Obsidian](https://obsidian.md/) supporta l'esportazione in PDF e la visualizzazione dei diagrammi Mermaid:

1. Importa il file `application_architecture.md` in un vault Obsidian
2. Apri il file
3. Clicca con il tasto destro e seleziona "Esporta in PDF"

## 7. Utilizzando Node.js e Puppeteer

Se preferisci un approccio programmatico, puoi utilizzare Node.js con Puppeteer:

1. Installa le dipendenze necessarie:
```bash
npm install puppeteer markdown-it mermaid
```

2. Crea uno script `generate-pdf.js`:
```javascript
const puppeteer = require('puppeteer');
const fs = require('fs');
const markdownIt = require('markdown-it');
const md = markdownIt();

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  const markdown = fs.readFileSync('application_architecture.md', 'utf8');
  const html = md.render(markdown);
  
  await page.setContent(html);
  await page.pdf({ path: 'architettura_applicazione.pdf', format: 'A4' });
  
  await browser.close();
})();
```

3. Esegui lo script:
```bash
node generate-pdf.js
```

## Nota sui Diagrammi Mermaid

Per assicurarti che i diagrammi Mermaid vengano correttamente renderizzati nel PDF, potresti dover:

1. Renderizzare prima i diagrammi come immagini PNG o SVG
2. Sostituire i blocchi di codice Mermaid con i riferimenti alle immagini
3. Quindi generare il PDF dal Markdown modificato

Questo può essere automatizzato con script o utilizzando strumenti come mermaid-cli.