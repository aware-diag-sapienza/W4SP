# Template-Index-Paper
 È un template per poter caricare sul server le pagine di presentazione dei paper tutte uguali. 
 
 ![alt text](https://i.ibb.co/Dk2K0Rz/tempale-server.png)
 
 Basta aggiornare la tabella in information-paper.tsv dove ci sono i seguenti campi:
 - title: titolo del paper 
 - authors: autori del paper separati da una virgola
 - venue: location del paper, con anche dati di location e giorni
 - doi: numero del DOI del paper
 - researchGate: link del paper aperto su researchGate. 
 - img: nome dell'immagine, da caricare nella cartella 'img'
 - key: fromato dell'immagine (es .png)
 - github_name: nome che sta sul bottone di GitHub. Se campo è 'null', il nome è vuoto, quindi si vede solo icona. Di default 'GitHub Repository'
 - github_link: link della repository GitHub
 - prototype_name: nome che sta sul bottone del prototipo. Se campo è 'null', il nome è vuoto, quindi si vede solo icona. Di default 'Validation Prototype'
 - prototype_link: link del prototipo funzionante
 - additional_name: nome che sta su un bottone aggiuntivo che si può customizzare. Se campo è 'null', il nome è vuoto, quindi si vede solo icona. Di default 'Additional Button'
 - additional_link: link del contenuto aggiuntivo
 - additional_icon: per customizzare l'icona presente nel bottone. l'icona deve avere come classe 'fa-2x' per la dimensione
 - video_name: nome che sta sul bottone del video. Se campo è 'null', il nome è vuoto, quindi si vede solo icona. Di default 'Demonstrative Video'
 - video_link: link del video
 - abstract: abstract del paper

La riga deve contenere tutte le informazioni di interesse. Se la casella rimane vuota l'elemento non viene aggiunto. Quindi la pagina di base è la stessa con delle informazioni in meno. 
Qui il risultato su un paper.
![alt text](http://url/to/img.png)

 ![alt text](https://i.ibb.co/bR1xKRM/risultato-server.png)
