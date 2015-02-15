/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
// Hier werden Datei"global" die Sprachen gespeichert aus der
// data/sprachen.json

var sprachen = {};
var sprachenGeladen = false;
var aktuelleSprache = null;
var aktuelleKartei = null;
var aktuelleVokabel = null;
var zeigeInfo = false;

// Variablen für den Lernmodus.
var punkte = 0;
var varZeit = '';
var sprachenUmkehren = false;
var timerID = null;

var app = {
    // Application Constructor
    initialize: function() {
        this.bindEvents();
        app.writeCallback = null;
        //app.sprachenLaden();
    },
    // Bind Event Listeners
    //
    // Bind any events that are required on startup. Common events are:
    // 'load', 'deviceready', 'offline', and 'online'.
    bindEvents: function() {
        document.addEventListener('deviceready', this.onDeviceReady, false);
    },
    // deviceready Event Handler
    //
    // The scope of 'this' is the event. In order to call the 'receivedEvent'
    // function, we must explicitly call 'app.receivedEvent(...);'
    onDeviceReady: function() {
        app.receivedEvent('deviceready');
    },
    // Update DOM on a Received Event
    receivedEvent: function(id) {
        app.sprachenFile = cordova.file.externalApplicationStorageDirectory == null ? cordova.file.applicationStorageDirectory : cordova.file.externalApplicationStorageDirectory;
        app.sprachenFile += 'sprachen.json';
        console.log("sprachen file: " + app.sprachenFile);
        window.resolveLocalFileSystemURL(app.sprachenFile, this.gotFile, this.failToRead);
    },

    // sprachen.json erfolgreich geladen
    gotFile: function(fileEntry) {
        fileEntry.file(function(file) {
            var reader = new FileReader(file);
            reader.onloadend = function() {
                if(this.result === '') {
                    app.sprachenLaden();
                }
                else {
                    sprachen = JSON.parse(this.result);
                }
                $('.listening').attr('style', 'display: none;');
                $('.received').attr('style', 'display: block;');
            };
            reader.readAsText(file);
        });
    },

    // Beim Laden sind Fehler aufgetreten, oder die Datei existiert nicht.
    failToRead: function(e) {
        switch(e.code) {
            case 1: // NOT_FOUND_ERR
                // Datei nicht gefunden, dann muss sprachen leer initialisiert werden.
                app.sprachenLaden();
                $('.listening').attr('style', 'display: none;');
                $('.received').attr('style', 'display: block;');
                break;
            default:
                // alle Fehlercodes auf: https://developer.mozilla.org/en-US/docs/Web/API/FileError#Error_codes
                alert("Es ist ein Fehler beim Laden aufgetreten. Bitte kontaktiere die Entwickler!");
                console.log('Filesystem Error: ' + e.code);
                break;
        }
    },

    // sprachen.js festschreiben
    writeFile: function(callback) {
        // Könnte problematisch sein, wenn writeFile direkt hintereinander
        // aufgerufen wird, und das Speichern einfach zu lange braucht.
        app.writeCallback = (callback === undefined)? null : callback;

        // Prüfen ob Schreibefunktion vorhanden (Browser meckert)
        if(window.requestFileSystem === undefined) {
            if(app.writeCallback != null) {
                app.writeCallback();
            }
            return;
        }

        // Speicher anfordern
        var speicherGroesse = 1024*1024*5; // 5 MiB
        // window.webkitStorageInfo soll veraltet sein, jedoch existiert
        // die navigator-Variante nicht auf älteren Geräten
        if(navigator.webkitPersistentStorage === undefined) {
            if(window.webkitStorageInfo === undefined) {
                window.requestFileSystem(PERSISTENT, speicherGroesse, app.onInitFs, app.errorHandler);
            }
            else {
                /*
                   window.webkitStorageInfo.requestQuota(PERSISTENT, speicherGroesse, function(grantedBytes) {
                   window.requestFileSystem(PERSISTENT, grantedBytes, onInitFs, errorHandler);
                   }, function(e) {
                   console.log('Error', e);
                   alert('speicher anfordern: ' + e.code);
                   });
                   */
                alert("Das sollte nicht passieren! Bitte melden!");
            }
        }
        else {
            navigator.webkitPersistentStorage.requestQuota(speicherGroesse, function(grantedBytes) {
                window.requestFileSystem(PERSISTENT, grantedBytes, app.onInitFs, app.errorHandler);
            }, function(e) {
                console.log('Error', e);
            });
        }
    },

    onInitFs: function(fs) {
        fs.root.getFile(app.sprachenFile.substr(7), {create: true}, function(fileEntry) {
            fileEntry.createWriter(function(fileWriter) {
                fileWriter.onwriteend = function(e) {
                    if(app.writeCallback != null) {
                        app.writeCallback();
                    }
                };

                fileWriter.onerror = function(e) {
                    if(app.writeCallback != null) {
                        app.writeCallback();
                    }
                };

                // Blob-Konstruktor ist nicht überall verfügbar. Wir müssen
                // prüfen, ob Android 4.1 schon über den Konstruktor verfügt;
                // falls nicht sollten wir den BlobBuilder verwenden
                //var sprachenBlob = new Blob([JSON.stringify(sprachen)], {type: 'text/plain'});
                var blob = null;
                if(window.WebKitBlobBuilder === undefined) {
                    blob = new Blob([JSON.stringify(sprachen)], {type: 'text/plain'});
                }
                else {
                    var builder = new WebKitBlobBuilder();
                    builder.append(JSON.stringify(sprachen));
                    blob = builder.getBlob();
                }
                fileWriter.write(blob);
            }, app.errorHandler);
        }, app.errorHandler);
    },

    errorHandler: function(e) {
        alert('Es ist ein Fehler aufgetreten: ' + e.code);
        console.log(e.code);
    },

    // Lädt die sprachen.json-Datei mit default-Werten.
    sprachenLaden: function() {
        if(sprachenGeladen) return;
        $.getJSON('data/sprachen.json', function( data ) {
            sprachen = data;
        });
        sprachenGeladen = true;
    },

    // Erstellt eine ID bestehend aus den übergebenen Parametern
    id: function(sprache, kartei, vokabel) {
        var r = '';
        if(sprache !== undefined) {
            r = sprache;
        }
        if(kartei !== undefined) {
            r += '-' + kartei;
        }
        if(vokabel !== undefined) {
            r += '-' + vokabel;
        }
        // Ersetze Leerzeichen (s = spaces) mit Bindestrichen
        return r.replace(/\s/g, '-');
    },

    // Gibt an, wieviele Vokabeln in einer Kartei sind.
    anzahlVokabeln: function(sprache, kartei) {
        var anzahlVokabeln =0;
        $.each(sprachen[sprache][kartei], function() {
            ++anzahlVokabeln;
        });
        return anzahlVokabeln;
    },
    
    // Die Vokabeln werden in einen zweidimensionalen Array gespeichert
    // zum Zugriff auf bestimmte Indizes.
    vokabelArray: function(sprache, kartei, anzahlVokabeln) {
        var x =0;
        var y = 0;
        var vokabelnArray = new Array(anzahlVokabeln);
        var vokabeln = sprachen[sprache][kartei];

        $.each(vokabeln, function(fremdsprache, deutsch) {
            vokabelnArray[x] = new Array(2);
            vokabelnArray[x][y] = fremdsprache;
            vokabelnArray[x][++y] = deutsch;
            ++x;
            y = 0;
        });
        return vokabelnArray;
    },

    // Rekursive Methode, die den Ablauf des Lern-Prozesses abwickelt.
    // Ruft sich so lange selbst auf, bis keine Vokabeln mehr vorhanden sind.
    lernen: function(x, y, vokNr, anzVokabeln, vokabeln){
        $('#lernen-btn-pruefen').off();
        $('#lernen-div-anzahl').html('Anzahl: ' + vokNr + ' / ' + anzVokabeln);
        if(!sprachenUmkehren)   $('#lernen-div-karteHead p').html(vokabeln[x][y]);
        else                    $('#lernen-div-karteHead p').html(vokabeln[x][++y]);

        $('#lernen-btn-pruefen').click( function(){
            $(this).button('disable');
            if(sprachenUmkehren) y = (-1);
            var val = $('#lernen-input-loesung').val().trim();
            var vok = vokabeln[x][++y];

            // Richtige Lösung wurde eingegeben (2 Punkte hierfür)
            if(val === vok) {
                punkte += 2;
                $('#lernen-div-karteBody p').html('Richtig! :)');
                $('#lernen-div-footLinks').addClass('richtig');
                $('#lernen-div-karteBody p').fadeIn(500).delay(2000).fadeOut(500);
                setTimeout(function(){
                    $('#lernen-div-footLinks').removeClass('richtig');
                    $('#lernen-input-loesung').val('').focus();
                    app.pruefeAnzahl(x, vokNr, anzVokabeln, vokabeln);
                    $('#lernen-btn-pruefen').button('enable');
                }, 3000);
            }
            // Ähnliche Lösung wurde eingegeben (1 Punkt hierfür)
            else if(app.soundex(val) === app.soundex(vok)) {
                punkte++;
                if(sprachenUmkehren) y = 0;
                $('#lernen-div-karteBody p').html('Fast! Richtige Lösung: ' + vokabeln[x][y]);
                $('#lernen-div-footLinks').addClass('fast');
                $('#lernen-div-karteBody p').fadeIn(500).delay(2000).fadeOut(500);
                setTimeout(function(){
                    $('#lernen-div-footLinks').removeClass('fast');
                    $('#lernen-input-loesung').val('').focus();
                    app.pruefeAnzahl(x, vokNr, anzVokabeln, vokabeln);
                    $('#lernen-btn-pruefen').button('enable');
                }, 3000);
            }
            // Falsche Lösung wurde eingegeben (0 Punkte hierfür)
            else {
                if(sprachenUmkehren) y = 0;
                $('#lernen-div-karteBody p').html('Leider falsch! Lösung: ' + vokabeln[x][y]);
                $('#lernen-div-footRechts').addClass('falsch');
                $('#lernen-div-karteBody p').fadeIn(500).delay(2000).fadeOut(500);
                setTimeout(function(){
                    $('#lernen-div-footRechts').removeClass('falsch');
                    $('#lernen-input-loesung').val('').focus();
                    app.pruefeAnzahl(x, vokNr, anzVokabeln, vokabeln);
                    $('#lernen-btn-pruefen').button('enable');
                }, 3000);
            }
        });
    },

    // Hilfsfunktion für lernen-Methode. Prüft, ob noch Vokabeln vorhanden und leitet weitere Schritte ein.
    // Zum Beispiel: speichern der Zeit und der Punkte in den localStorage und Weiterleitung.
    pruefeAnzahl: function(x, vokNr, anzVokabeln, vokabeln) {
        if(vokNr < anzVokabeln) {
            app.lernen(++x, 0, ++vokNr, anzVokabeln, vokabeln);
        }
        // Keine Vokabeln mehr vorhanden
        else {
            $('#lernen-btn-start').fadeIn(500);
            $('#lernen-btn-richtung').fadeIn(500);
            clearInterval(timerID);
            timerID = null;
            punkte = parseInt(punkte / (anzVokabeln * 2) * 100);
            varZeit = $('#lernen-div-zeit').html();

            var ergebnisseIndex = (new Date()).toLocaleString() + ' - ' + app.id(aktuelleSprache, aktuelleKartei);
            var ergebnissWert = punkte + ' %, ' + varZeit + ' Minuten';

            var aktuellerSpeicher = localStorage.aktuellerSpeicher === undefined ? 0 : parseInt(localStorage.aktuellerSpeicher);

            var ergebnisse = localStorage.ergebnisse === undefined ? [] : JSON.parse(localStorage.ergebnisse);
            ergebnisse[aktuellerSpeicher] = { 'index': ergebnisseIndex, 'wert': ergebnissWert };

            // Maximal 15 Einträge speichern
            aktuellerSpeicher = ++aktuellerSpeicher % 15;
            localStorage.aktuellerSpeicher = aktuellerSpeicher;

            localStorage.ergebnisse = JSON.stringify(ergebnisse);

            // Weiterleitung auf den Lernfortschritt, wenn Kartei fertig gelernt wurde.
            window.location = '#Lernfortschritt';
        }
    },

    // Gibt die Zeit im Lernmodus aus
    zeit: function() {
        var minuten = 0;
        var sekunden = 0;
        var sekundenZaehler = 0;
        timerID = setInterval(function() {
            sekundenZaehler++;
            sekunden = app.zeitFormat(sekundenZaehler);
            minuten = app.zeitFormat(parseInt(sekundenZaehler/60));
            $('#lernen-div-zeit').html('Zeit: ' + minuten + ':' + sekunden);
        }, 1000);
    },
    
    // Formatierung der Zeit-Ausgabe
    zeitFormat: function(wert) {
        var wertStr = wert+'';
        if(wertStr.length < 2) {
            return '0' + wertStr;
        }
        else {
            return wertStr;
        }
    },

    // zum Vergleichen, ob Wörter ähnlich sind
    // implementiert den Soundex-Algorithmus.
    // Code stammt von:
    // https://gist.github.com/shawndumas/1262659
    soundex: function(s) {
        var a = s.toLowerCase().split(''),
        f = a.shift(),
        r = '',
        codes = {
            a: '', e: '', i: '', o: '', u: '',
            b: 1, f: 1, p: 1, v: 1,
            c: 2, g: 2, j: 2, k: 2, q: 2, s: 2, x: 2, z: 2,
            d: 3, t: 3,
            l: 4,
            m: 5, n: 5,
            r: 6
        };
        r = f +
            a
        .map(function (v, i, a) { return codes[v] })
        .filter(function (v, i, a) {
            return ((i === 0) ? v !== codes[f] : v !== a[i - 1]);
        })
        .join('');
        return (r + '000').slice(0, 4).toUpperCase();
    },

    // Mischt den 2-dim. Array und gibt diesen zurück
    shuffleArray: function(array, anzVokabeln) {
        for (var i = anzVokabeln - 1; i > 0; i--) {
            var j = Math.floor(Math.random() * (i + 1));
            var temp = [['', '']];
            temp[0][0] = array[i][0];
            temp[0][1] = array[i][1];

            array[i][0] = array[j][0];
            array[i][1] = array[j][1];

            array[j][0] = temp[0][0];
            array[j][1] = temp[0][1];
        }
        return array;
    },

    // Regelt die Anzeige der Meldungen "wirklich löschen?" und "erfolgreich gelöscht!"
    // sowie die Anzeige der Buttons etc.
    karteiverwaltungAnzeigen: function() {
        $('#Karteiverwaltung').children().off();
        $('#karteiverw-coll-sprachenListe').children().off();
        $('#karteiverw-coll-sprachenListe').children().find(':checkbox').off();

        $('#karteiverw-coll-sprachenListe').empty();

        $('#karteiverw-btn-lernen').hide();
        $('#karteiverw-btn-oeffnen').hide();
        $('#karteiverw-btn-loeschen').hide().off().on('click', function() {
            dialog.inhalt('Kartei löschen', 'Möchtest Du die Karteien wirklich löschen?',
                          function() {
                              var abgehakteBoxen = $('#karteiverw-coll-sprachenListe').find('input:checkbox:checked');
                              $.each(abgehakteBoxen, function(i, checkbox) {
                                  var kartei = $(checkbox).val();
                                  if(sprachen[aktuelleSprache] !== undefined && sprachen[aktuelleSprache][kartei] !== undefined) {
                                      delete sprachen[aktuelleSprache][kartei];
                                  }
                              });

                              var checkboxenSprache = $('#karteiverw-coll-sprachenListe div[data-sprache="' + aktuelleSprache + '"]').find('input:checkbox');
                              if(abgehakteBoxen.length == checkboxenSprache.length) {
                                  if(sprachen[aktuelleSprache] !== undefined) {
                                      delete sprachen[aktuelleSprache];
                                  }
                              }

                              app.writeFile(function() {
                                  nachricht.inhalt(nachrichtTyp.INFORMATION, 'Die gewählten Karteien<br>wurden gelöscht!', 500, 500);
                                  nachricht.pruefenUndAnzeigen();
                                  app.karteiverwaltungAnzeigen();
                              });
                              dialog.leeren();
                              dialog.entfernen();
                          },
                          function() {
                              dialog.leeren();
                              dialog.entfernen();
                          }
                         );
        });

        nachricht.pruefenUndAnzeigen();

        var collapsible = '';
        // Verschachtelte Schleife generiert das Collapsibel-Set mit Checkboxen für die Karteien
        $.each(sprachen, function(sprache) {
            collapsible += '<div data-role="collapsible" data-iconpos="right" data-sprache="' + sprache + '"><h3>' + sprache + '</h3>'
            +  '<fieldset data-role="controlgroup">';   
            $.each(sprachen[sprache], function(kartei) {
                collapsible += '<label for="kartei-' + app.id(sprache, kartei) +'">'
                +  '<input type="checkbox" value="' + kartei + '" data-mini="true" id="kartei-' + app.id(sprache, kartei) + '">'
                +   kartei + '</label>';
            });
            collapsible += '</fieldset></div>';
        });
        
        // unpassende Überschrift wird ausgeblendet
        if(collapsible != '')   $('#karteiverw-h2-keineSprachen').hide();
        else                    $('#karteiverw-h2-spracheWaehlen').hide();

        $('#karteiverw-coll-sprachenListe').append(collapsible);
        $('#karteiverw-coll-sprachenListe').collapsibleset('refresh').trigger("create");

        // ausgewählte/ausgeklappte Sprache speichern
        $('#karteiverw-coll-sprachenListe').children().on('collapsibleexpand', function(event, ui) {
            aktuelleSprache = $(this).attr('data-sprache');
        });

        // Anzeigen/Ausblenden bestimmter Elemente und passende Ansicht
        var einAusblendeGeschw = 400;
        $('#karteiverw-coll-sprachenListe').children().on('collapsiblecollapse', function(event, ui) {
            $(this).find('input:checked').attr('checked', false);
            $(this).find('input[type="checkbox"]').checkboxradio('refresh');
            $('#karteiverw-btn-loeschen').hide(einAusblendeGeschw);
            $('#karteiverw-btn-lernen').hide(einAusblendeGeschw);
            $('#karteiverw-btn-oeffnen').hide(einAusblendeGeschw);
        });
        
        // Verstecken und zeigen der Buttons, je nachdem wieviele Karteien gewählt wurden
        $('#karteiverw-coll-sprachenListe').children().find(':checkbox').on('click', function() {
            var anzahlAusgewaehlt = $('#karteiverw-coll-sprachenListe').find('input:checked').length;
            switch(anzahlAusgewaehlt) {
                case 0:
                    $('#karteiverw-btn-loeschen').hide(einAusblendeGeschw);
                    $('#karteiverw-btn-lernen').hide(einAusblendeGeschw);
                    $('#karteiverw-btn-oeffnen').hide(einAusblendeGeschw);
                break;
                case 1:
                    $('#karteiverw-btn-loeschen').show(einAusblendeGeschw);
                    $('#karteiverw-btn-lernen').show(einAusblendeGeschw);
                    $('#karteiverw-btn-oeffnen').show(einAusblendeGeschw);
                    aktuelleKartei = $('#karteiverw-coll-sprachenListe').find('input:checked').val();   // Der name der gewählten Kartei wird gespeichert
                break;
                default:
                    $('#karteiverw-btn-loeschen').show(einAusblendeGeschw);
                    $('#karteiverw-btn-lernen').hide(einAusblendeGeschw);
                    $('#karteiverw-btn-oeffnen').hide(einAusblendeGeschw);
                break;
            }
        });
    },

    // Aktualisiert die Vokabelverwaltung. Wird benötigt, weil die Liste nach
    // Löschen von Karteien und Sprachen aktualisiert werden muss und ein
    // einfaches refresh zu Problemen führt.
    vokabelverwaltungAnzeigen: function() {
        $('#vokabelverw-div-vokListe').children().find(':checkbox').off();
        $('#vokabelverw-liste').empty();

        $('#vokabelverw-btn-loeschen').hide().off().on('click', function() {
            dialog.inhalt('Vokabel löschen', 'Möchtest Du die Vokabeln wirklich löschen?',
                          function() {
                              var abgehakteBoxen = $('#vokabelverw-div-vokListe').find('input:checkbox:checked');
                              $.each(abgehakteBoxen, function(i, checkbox) {
                                  var vokabel = $(checkbox).val();
                                  if(sprachen[aktuelleSprache] !== undefined &&
                                     sprachen[aktuelleSprache][aktuelleKartei] !== undefined &&
                                         sprachen[aktuelleSprache][aktuelleKartei][vokabel] !== undefined) {

                                      delete sprachen[aktuelleSprache][aktuelleKartei][vokabel];
                                  }
                              });

                              app.writeFile(function() {
                                  nachricht.inhalt(nachrichtTyp.INFORMATION, 'Die gewählten Vokabeln<br>wurden gelöscht!', 500, 500);
                                  nachricht.pruefenUndAnzeigen();
                                  app.vokabelverwaltungAnzeigen();
                              });
                              dialog.leeren();
                              dialog.entfernen();
                          },
                          function() {
                              dialog.leeren();
                              dialog.entfernen();
                          }
                         );
        });

        nachricht.pruefenUndAnzeigen();

        if(aktuelleKartei != null)  var pfad = '<h2>' + aktuelleSprache + ' - ' + aktuelleKartei + '</h2>';
        else                        var pfad = '<h2>' + aktuelleSprache + '</h2>';

        if(aktuelleKartei == null)     return;

        var controlGroup = '<fieldset id="vokabelverw-div-vokListe" data-role="controlgroup">';
        var vokabeln = sprachen[aktuelleSprache][aktuelleKartei];

        // Anzeigen der Vokabeln mit Checkboxen
        $.each(vokabeln, function(fremdsprache, deutsch) {
            controlGroup += '<label for="vokabel-' + app.id(fremdsprache, deutsch) +'">'
            +  '<input type="checkbox" value="'+fremdsprache+'" data-mini="true" '
            +  'id="vokabel-'+ app.id(fremdsprache, deutsch) +'">' + fremdsprache + ' – ' + deutsch + '</label>';
        });

        $('#vokabelverw-liste').append(controlGroup).trigger('create');
        $('#vokabelverw-div-vokListe').prepend(pfad);

        // Unpassende Überschrift ausblenden
        if(controlGroup != '')  $('#vokabelverw-h2-keineVokabeln').hide();
        else                    $('#vokabelverw-h2-vokabelnWaehlen').hide();

        // Ein- Ausblenden des löschen-Buttons
        $('#vokabelverw-div-vokListe').children().find(':checkbox').on('click', function() {
            var einAusblendeGeschw = 400;
            var anzahlAusgewaehlt = $('#vokabelverw-div-vokListe').find('input:checked').length;

            switch(anzahlAusgewaehlt) {
                case 0:
                    $('#vokabelverw-btn-loeschen').hide(einAusblendeGeschw);
                break;
                default:
                    $('#vokabelverw-btn-loeschen').show(einAusblendeGeschw);
                break;
            }
        });
    }
};

var nachrichtTyp = Object.freeze({
    WARNUNG: 0,
    INFORMATION: 1
});

var nachricht = {
    // Initialisiert eine Nachricht vom angegebenen Typ, mit dem engegebenen
    // Text und den zwei optionalen Parametern zum Ein- und Ausblenden.
    inhalt: function(typ, text, dauerEinblenden, dauerAusblenden) {
        if(typ === undefined || text === undefined) {
            return;
        }

        if(this.typ !== undefined || this.text !== undefined) {
            nachricht.entfernen();
        }

        this.typ = typ;
        this.text = text;

        if(dauerEinblenden !== undefined) {
            this.dauerEin = dauerEinblenden;
        }

        if(dauerAusblenden !== undefined) {
            this.dauerAus = dauerAusblenden;
        }
    },

    // prueft ob inhalt ungleich null ist und zeigt die entsprechende
    // Nachricht an.
    pruefenUndAnzeigen: function() {
        if(this.typ === undefined ||
           this.text === undefined) {
            return;
        }

        var dialog = $('<div></div>').attr('id', 'nachrichten-dialog');
        var link = $('<a></a>').attr('class', 'ui-btn ui-corner-all ui-btn-icon-left').attr('href', '#');

        link.html(this.text);

        switch(this.typ) {
            case nachrichtTyp.WARNUNG:
                link.addClass('a-warnung').addClass('ui-icon-alert');
                break;
            case nachrichtTyp.INFORMATION:
                link.addClass('a-hinweis').addClass('ui-icon-info');
                dialog.addClass('div-hinweis');
                break;
        }

        if(this.dauerEin !== undefined) {
            var dauer = parseInt(this.dauerEin);
            dialog.hide();

            if(this.dauerAus === undefined) {
                dialog.fadeIn(dauer).delay(2000);
            }
            else {
                var dauer2 = parseInt(this.dauerAus);
                dialog.fadeIn(dauer).delay(2000).fadeOut(dauer2);
                nachricht.entfernen();
            }
        }

        dialog.append(link);
        $('body').append(dialog);
        nachricht.leeren();
    },

    // Setzt die Attribute zurück. Wird benötigt, um zu überprüfen ob
    // bereits eine Nachricht angezeigt wird/vorhanden ist. Es kann
    // immer nur eine Nachricht angezeigt werden; ältere werden
    // gelöscht.
    leeren: function() {
        this.typ = undefined;
        this.text = undefined;
        this.dauer = undefined;
    },

    // Entfernt das Element der Nachricht
    entfernen: function(dauer) {
        if(dauer !== undefined) {
            $('#nachrichten-dialog').fadeOut(dauer, function() {
                $('#nachrichten-dialog').remove();
            });
        }
        else {
            $('#nachrichten-dialog').remove();
        }
    }
};

var dialog = {
    // Erzeugt einen Dialog mit zwei Buttons, mit dem angegebenen Titel,
    // Text und die zwei Buttons werden entsprechend mit dem ja und nein
    // Callback "verbunden".
    // Der Dialog wird anders als bei "nachricht" direkt angezeigt.
    inhalt: function(titel, text, jaCallback, neinCallback) {
        if(titel === undefined &&
           text === undefined &&
               jaCallback === undefined &&
                   neinCallback === undefined) {
            return;
        }

        if(this.titel !== undefined ||
           this.text !== undefined ||
               this.jacb !== undefined ||
                   this.neincb !== undefined) {
            dialog.entfernen();
        }

        this.titel = titel;
        this.text = text;
        this.jacb = jaCallback;
        this.neincb = neinCallback;

        var hintergrund = $('<div></div>').addClass('loeschen-hintergrund');
        var loeschenDialog = $('<div></div>').attr('id', 'loeschen-dialog');
        var titelDiv = $('<div></div>').addClass('loeschen-dialog-titel').text(this.titel);
        var textDiv = $('<div></div>').addClass('loeschen-dialog-text').text(this.text);
        var btnDiv = $('<div></div>').addClass('loeschen-dialog-btn');

        var jaBtn = $('<input></input>').attr('type', 'button').attr('class', 'ui-btn ui-corner-all ui-btn-inline ui-mini');
        var neinBtn = $('<input></input>').attr('type', 'button').attr('class', 'ui-btn ui-corner-all ui-btn-inline ui-mini');

        // Beschriftung
        jaBtn.val('löschen');
        neinBtn.val('abbrechen');

        var me = this;
        // Klick-Event hinzufügen
        jaBtn.on('click', function() { me.jacb(); });
        neinBtn.on('click', function() { me.neincb(); });

        btnDiv.append(jaBtn).append(neinBtn);
        loeschenDialog.append(titelDiv).append(textDiv).append(btnDiv);
        $('body').append(hintergrund).append(loeschenDialog);
    },

    leeren: function() {
        this.titel = undefined;
        this.text = undefined;
        this.jacb = undefined;
        this.neincb = undefined;
    },

    entfernen: function() {
        $('#loeschen-dialog').remove();
        $('.loeschen-hintergrund').remove();
    }
};

app.initialize();

// Beim Laden der App, Sprachen-Datei einlesen. Diese Funktion muss für die App
// noch in the app.onDeviceReady verschoben werden.
$(document).ready(function() {
    app.sprachenLaden();
    $.mobile.defaultPageTransition = 'slidefade';
    $('#neueKartei-div-spracheHinzu').hide();
});

/************************************************************************************************
***************************************** KARTEIVERWALTUNG **************************************
************************************************************************************************/

$('#Karteiverwaltung').on('pagebeforeshow', function(event, ui) {
    app.karteiverwaltungAnzeigen();
});

/************************************************************************************************
**************************************** VOKABELVERWALTUNG **************************************
************************************************************************************************/

$('#Vokabelverwaltung').on( 'pagebeforeshow', function( event, ui ) { 
    app.vokabelverwaltungAnzeigen();
});

/************************************************************************************************
******************************************** NEUE KARTEI ****************************************
************************************************************************************************/

$('#NeueKartei').on('pagebeforeshow', function(event, ui) {
    $('#neueKartei-coll-sprachenListe').off();
    $('#neueKartei-btn-spracheHinzu').off();
    $('#neueKartei-input-kartei').off();
    $('#neueKartei-input-sprache').off();

    $('#neueKartei-coll-sprachenListe').empty();
    $('#neueKartei-input-kartei').val('');
    $('#neueKartei-input-sprache').val('');

    $('#neueKartei-coll-sprachenListe').show();
    $('#neueKartei-btn-spracheHinzu').show();
    $('#neueKartei-div-spracheHinzu').hide();

    aktuelleSprache = '';
    var collapsible = '';
    var spracheToggle = null;

    collapsible += '<div data-role="collapsible"><h3>Sprachen wählen</h3><form><fieldset data-role="controlgroup">';   
    $.each(sprachen, function(sprache) {
        collapsible += '<label for="neueKartei-coll-sprachenListe-radio-' + sprache + '">'
        +  '<input type="radio" id="neueKartei-coll-sprachenListe-radio-' + sprache + '"data-mini="true" name="sprache" value="' + sprache + '">'
        + sprache + '</label>';
    });
    collapsible += '</fieldset></form></div>';

    $('#neueKartei-coll-sprachenListe').append(collapsible);
    $('#neueKartei-coll-sprachenListe').collapsibleset('refresh').trigger('create');

    // Noch keine Sprachen vorhanden
    if($.isEmptyObject(sprachen))   $('#neueKartei-coll-sprachenListe').hide(); 

    // "Sprache wählen" wird betätigt
    $('#neueKartei-coll-sprachenListe').on('collapsibleexpand', function(){     
        $('#neueKartei-btn-spracheHinzu').slideUp();
        aktuelleSprache = '';
        spracheToggle = true;
    });

    // "Sprache wählen" wird betätigt
    $('#neueKartei-coll-sprachenListe').on('collapsiblecollapse', function(){     
        $('#neueKartei-btn-spracheHinzu').slideDown();
        aktuelleSprache = '';
        spracheToggle = false;
    });

    var zeigeInput = false;
    // "Sprache hinzufügen" wird betätigt
    $('#neueKartei-btn-spracheHinzu').click( function(){      
        if(zeigeInput) {
            console.log("this");
            $('#neueKartei-div-spracheHinzu').fadeOut();
            if(!$.isEmptyObject(sprachen))  $('#neueKartei-coll-sprachenListe').slideDown();
        }
        else {
            console.log("that");
            $('#neueKartei-div-spracheHinzu').fadeIn();
            if(!$.isEmptyObject(sprachen))  $('#neueKartei-coll-sprachenListe').slideUp();
        }
        zeigeInput = !zeigeInput;
        aktuelleSprache = '';
        spracheToggle = false;
    });

    $('#neueKartei-btn-karteiSpeichern').on('click', function() {

        var sprache = '';
        var kartei = '';
        var fehlermeldung = 'Du musst eine Sprache <br>wählen und einen<br>Karteinamen eingeben!';

        if(spracheToggle === true) { // aus der Liste
            sprache = $('#neueKartei-coll-sprachenListe').find(':checked');
            if(sprache.length == 0) {
                nachricht.inhalt(nachrichtTyp.WARNUNG, fehlermeldung, 500);
                nachricht.pruefenUndAnzeigen();
                $('#neueKartei-coll-sprachenListe').addClass('div-markiert');
                $('#neueKartei-coll-sprachenListe').find(':radio').on('click', function(){  // Sobald ein Radiobutton geklickt wird, verschwindet der Hinweis
                    nachricht.entfernen(500);
                    $('#neueKartei-coll-sprachenListe').removeClass('div-markiert');
                });
                return;
            }
            aktuelleSprache = sprache.val();
            sprache = sprache.val();
        }
        else if(spracheToggle === false) {
            sprache = $('#neueKartei-input-sprache').val();
            if(sprache === '') {
                nachricht.inhalt(nachrichtTyp.WARNUNG, fehlermeldung, 500);
                nachricht.pruefenUndAnzeigen();
                $('#neueKartei-input-sprache').addClass("inputText");
                $('#neueKartei-div-content').find('#neueKartei-input-sprache').on('click', function(){  // Sobald das input-field (Sprache) geklickt wird, verschwindet der Hinweis
                    nachricht.entfernen(500);
                    $('#neueKartei-input-sprache').removeClass("inputText");
                });
                return;
            }
            aktuelleSprache = sprache;
        }

        var kartei = $('#neueKartei-input-kartei').val();
        aktuelleKartei = $('#neueKartei-input-kartei').val();
        if(kartei === '' || sprache === '') {
            nachricht.inhalt(nachrichtTyp.WARNUNG, fehlermeldung, 500, 500);
            nachricht.pruefenUndAnzeigen();
            $('#neueKartei-input-kartei').addClass("inputText");
            return;
        }

        // Und zum Schluss einfügen in die Sprachen
        if(sprachen[sprache] === undefined) {
            sprachen[sprache] = {};
        }
        sprachen[sprache][kartei] = {};

        // sprachen in sprachen.js festschreiben
        app.writeFile(function() {
            nachricht.inhalt(nachrichtTyp.INFORMATION, 'Die Kartei wurde<br>erfolgreich gespeichert', 500, 500);
            nachricht.pruefenUndAnzeigen();
            // Nachdem der Hinweis verschwindet, kann man direkt Vokabeln hinzufügen
            setTimeout(function(){ 
                window.location = '#NeueVokabel';
            }, 3000);
        });
    });
});

/************************************************************************************************
******************************************* NEUE VOKABEL ****************************************
************************************************************************************************/

$('#NeueVokabel').on('pagebeforeshow', function(event, ui) {
    $('#neueVokabel-btn-vokabelSpeichern').off();
    $('#neueVokabel-input-deutsch').off();
    $('#neueVokabel-input-uebersetzung').off();

    $('#neueVokabel-input-deutsch').val('');
    $('#neueVokabel-input-uebersetzung').val('');

    var ueberschrift = aktuelleSprache + ' – ' + aktuelleKartei;
    $('#neuevokabel-div-content > h2').empty().append(ueberschrift);

    if($('#neueVokabel-input-deutsch').autocomplete('instance') !== undefined) {
        $('#neueVokabel-input-deutsch').autocomplete( "destroy" );
    }
    $('#neueVokabel-input-deutsch').autocomplete({
        source: 'http://avocado.wc.lt/index.php?sprache='+aktuelleSprache+'&sprache2=deutsch'
    });

    if($('#neueVokabel-input-uebersetzung').autocomplete('instance') !== undefined) {
        $('#neueVokabel-input-uebersetzung').autocomplete( "destroy" );
    }
    $('#neueVokabel-input-uebersetzung').autocomplete({
        source: 'http://avocado.wc.lt/index.php?sprache='+aktuelleSprache+'&sprache2='+aktuelleSprache
    });

    $('#neueVokabel-btn-vokabelSpeichern').on('click', function() {
        var deutsch = $('#neueVokabel-input-deutsch').val();
        var uebersetzung = $('#neueVokabel-input-uebersetzung').val();
        var fehlermeldung = 'Bitte gib ein deutsches<br>Wort und eine<br>Übersetzung ein!';

        if(deutsch === '') {
            nachricht.inhalt(nachrichtTyp.WARNUNG, fehlermeldung, 500);
            nachricht.pruefenUndAnzeigen();
            $('#neueVokabel-input-deutsch').addClass("inputText");
            $('#neuevokabel-div-content').find('#neueVokabel-input-deutsch').on('click', function(){
                nachricht.entfernen(500);
                $('#neueVokabel-input-deutsch').removeClass("inputText");
            });
            return;
        }

        if(uebersetzung === '') {
            nachricht.inhalt(nachrichtTyp.WARNUNG, fehlermeldung, 500);
            nachricht.pruefenUndAnzeigen();
            $('#neueVokabel-input-uebersetzung').addClass("inputText");
            $('#neuevokabel-div-content').find('#neueVokabel-input-uebersetzung').on('click', function(){
                nachricht.entfernen(500);
                $('#neueVokabel-input-uebersetzung').removeClass("inputText");
            });
            return;
        }

        sprachen[aktuelleSprache][aktuelleKartei][uebersetzung] = {};
        sprachen[aktuelleSprache][aktuelleKartei][uebersetzung] = deutsch;
        app.writeFile(function() {
            nachricht.inhalt(nachrichtTyp.INFORMATION, 'Die Vokabel wurde<br>erfolgreich gespeichert!', 500, 500);
            nachricht.pruefenUndAnzeigen();
            $('#neueVokabel-input-deutsch').val('').focus();
            $('#neueVokabel-input-uebersetzung').val('');
        });
    });
});

/************************************************************************************************
********************************************** LERNEN *******************************************
************************************************************************************************/

$('#Lernen').on('pagebeforeshow', function(event, ui) {
    var anzVokabeln = app.anzahlVokabeln(aktuelleSprache, aktuelleKartei);
    var vokabeln = app.vokabelArray(aktuelleSprache, aktuelleKartei, anzVokabeln);    // Vokabeln werden als 2-Dim Array gespeichert
    var ueberschrift = aktuelleSprache + ' – ' + aktuelleKartei;
    vokabeln = app.shuffleArray(vokabeln, anzVokabeln);

    // Zurücksetzen und herstellen der default-Einstellungen
    if(timerID != null) {
        clearInterval(timerID);
        timerID = null;
    }
    punkte = 0;    
    varZeit = '';
    sprachenUmkehren = false;
    $('#lernen-input-loesung').val('').prop('disabled', true);
    $('#lernen-div-zeit').html('Zeit: 00:00');
    $('#lernen-div-karteHead p').html('Bitte "start" drücken');
    $('#lernen-btn-richtung').off().text('Fremdsprache - Deutsch');
    $('#lernen-btn-start').off().show();
    $('#lernen-btn-richtung').show();
    $('#lernen-btn-pruefen').button('disable');

    $('#lernen-div-anzahl').html('Anzahl: 0 / ' + anzVokabeln);
    $('#lernen-div-content > h2').html(ueberschrift);

    $('#lernen-btn-richtung').click( function(){    // Lern-Richtung wird umgekehrt
        sprachenUmkehren = (sprachenUmkehren == false) ? true : false;
        $(this).text(function(i, text){
            return text === "Fremdsprache - Deutsch" ? "Deutsch - Fremdsprache" : "Fremdsprache - Deutsch";
        });
    });

    $('#lernen-btn-start').click( function(){
        $('#lernen-btn-start').fadeOut(500);
        $('#lernen-btn-richtung').fadeOut(500);
        app.zeit();
        app.lernen(0, 0, 1, anzVokabeln, vokabeln);
        $('#lernen-btn-pruefen').button('enable');
        $('#lernen-input-loesung').prop('disabled', false).focus();
    });
});

/************************************************************************************************
****************************************** LERNVORTSCHRITT **************************************
************************************************************************************************/

$('#Lernfortschritt').on('pagebeforeshow', function(event, ui) {
    $('#lernfort-list-ergebnisse').empty();
    var ergebnisse = localStorage.ergebnisse === undefined ? [] : JSON.parse(localStorage.ergebnisse);
    if(localStorage.ergebnisse !== undefined) {
        for(var index in ergebnisse) {
            var ergebnis = ergebnisse[index];
            $('#lernfort-list-ergebnisse').append('<li data-icon="false">' + ergebnis.index + ' - ' + ergebnis.wert + '</li>');
        }
    }
    else {
        $('#lernfort-list-ergebnisse').append('<li data-icon="false">Es sind noch keine Ergebnisse vorhanden!</li>');
    }
    $('#lernfort-list-ergebnisse').listview('refresh');
});

