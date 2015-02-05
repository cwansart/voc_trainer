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
// Variablen für den Lernmodus
var punkte = 0;
var varZeit = '';
var sprachenUmkehren = false;

var app = {
    // Application Constructor
    initialize: function() {
        this.bindEvents();
        this.writeCallback = null;
        //sprachenLaden();
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
        console.log('Received Event: ' + id);

        app.sprachenFile = cordova.file.externalApplicationStorageDirectory + 'sprachen.json';
        window.resolveLocalFileSystemURL(app.sprachenFile, this.gotFile, this.failToRead);
    },

    // sprachen.json erfolgreich geladen
    gotFile: function(fileEntry) {
        fileEntry.file(function(file) {
            var reader = new FileReader(file);
            reader.onloadend = function() {
                if(this.result === '') {
                    sprachen = {};
                }
                else {
                    sprachen = JSON.parse(this.result);
                }
                console.log("Dateien gelesen");
                $('.listening').attr('style', 'display: none;');
                $('.received').attr('style', 'display: block;');
            };
            reader.readAsText(file);
        });
    },

    // beim Laden sind Fehler aufgetreten, oder die Datei existiert nicht.
    failToRead: function(e) {
        switch(e.code) {
            case 1: // NOT_FOUND_ERR
                // Datei nicht gefunden, dann muss sprachen leer initialisiert werden.
                sprachen = {};
                console.log("sprachen.json nicht vorhanden");
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
        // könnte problematisch sein, wenn writeFile direkt hinterinander
        // aufgerufen wird, und das Speichern einfach zu lange braucht.
        this.writeCallback = (callback === undefined)? null : callback;

        // Prüfen ob Schreibefunktion vorhanden (Browser meckert)
        if(window.requestFileSystem === undefined) {
            if(this.writeCallback != null) {
                this.writeCallback();
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
        var me = this;
        fs.root.getFile(app.sprachenFile.substr(7), {create: true}, function(fileEntry) {
            fileEntry.createWriter(function(fileWriter) {
                fileWriter.onwriteend = function(e) {
                    console.log("sprachen.json geschrieben");
                    if(me.writeCallback != null) {
                        var cb = me.writeCallback;
                        cb();
                    }
                };

                fileWriter.onerror = function(e) {
                    console.log('Schreiben fehlgeschlagen: ' + e.toString());
                    if(me.writeCallback != null) {
                        var cb = me.writeCallback;
                        cb();
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
        console.log(e.code);
    },

};

app.initialize();

// Beim Laden der App, Sprachen-Datei einlesen. Diese Funktion muss für die App
// noch in the app.onDeviceReady verschoben werden.
$(document).ready(function() {
    sprachenLaden();
    $.mobile.defaultPageTransition = 'slidefade';
	$('#neueKartei-div-spracheHinzu').hide();
});

function sprachenLaden() {
    console.log("sprachen laden");
    if(sprachenGeladen) return;
    $.getJSON('data/sprachen.json', function( data ) {
        sprachen = data;
    });
    sprachenGeladen = true;
}

$('#Karteiverwaltung').on('pagebeforeshow', function(event, ui) {
    $('#Karteiverwaltung').children().off();
    $('#karteiverw-coll-sprachenListe').children().off();
    $('#karteiverw-coll-sprachenListe').children().find(':checkbox').off();
    
    $('#karteiverw-coll-sprachenListe').empty();

    if(zeigeInfo) {
        $('#karteiverw-div-hinweis').show();
        zeigeInfo = false;
    }
    else {
        $('#karteiverw-div-hinweis').hide();
    }
    $('#karteiverw-btn-loeschen').hide();
    $('#karteiverw-btn-lernen').hide();
    $('#karteiverw-btn-oeffnen').hide();

    var collapsible = '';
    $.each(sprachen, function(sprache) {
        collapsible += '<div data-role="collapsible" data-iconpos="right" data-sprache="' + sprache + '"><h3>' + sprache + '</h3>'
                    +  '<fieldset data-role="controlgroup">';   //div noch schließen 
        $.each(sprachen[sprache], function(kartei) {
            collapsible += '<label for="kartei-' + id(sprache, kartei) +'">'
                        +  '<input type="checkbox" value="' + kartei + '" data-mini="true" id="kartei-' + id(sprache, kartei) + '">'
                        +   kartei + '</label>';
        });
        collapsible += '</fieldset></div>';
    });
    
    if(collapsible != '')   $('#karteiverw-h2-keineSprachen').hide();
    else                    $('#karteiverw-h2-spracheWaehlen').hide();

    $('#karteiverw-coll-sprachenListe').append(collapsible);
    $('#karteiverw-coll-sprachenListe').collapsibleset('refresh').trigger("create");
    
    // ausgewählte/ausgeklappte Sprache speichern
    $('#karteiverw-coll-sprachenListe').children().on('collapsibleexpand', function(event, ui) {
        aktuelleSprache = $(this).attr('data-sprache');
        console.log('Aktuelle Sprache gesetzt: ' + aktuelleSprache);
    });

    var einAusblendeGeschw = 400;
    $('#karteiverw-coll-sprachenListe').children().on('collapsiblecollapse', function(event, ui) {
        $(this).find('input:checked').attr('checked', false);
        $(this).find('input[type="checkbox"]').checkboxradio('refresh');
        $('#karteiverw-btn-loeschen').hide(einAusblendeGeschw);
        $('#karteiverw-btn-lernen').hide(einAusblendeGeschw);
        $('#karteiverw-btn-oeffnen').hide(einAusblendeGeschw);
    });

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
});

$('#Vokabelverwaltung').on( 'pagebeforeshow', function( event, ui ) { 
    $('#vokabelverw-div-vokListe').children().find(':checkbox').off();

    $('#vokabelverw-liste').empty();

	$('#vokabelverw-btn-loeschen').hide();
    if(zeigeInfo) {
        $('#vokabelverw-div-hinweis').show();
        zeigeInfo = false;
    }
    else {
        $('#vokabelverw-div-hinweis').hide();
    }

    if(aktuelleKartei != null)  var pfad = '<h2>' + aktuelleSprache + ' - ' + aktuelleKartei + '</h2>';
    else var pfad = '<h2>' + aktuelleSprache + '</h2>';

    if(aktuelleKartei == null) return;

    var controlGroup = '<fieldset id="vokabelverw-div-vokListe" data-role="controlgroup">';
    var vokabeln = sprachen[aktuelleSprache][aktuelleKartei];
    
    $.each(vokabeln, function(fremdsprache, deutsch) {
        controlGroup += '<label for="vokabel-' + id(fremdsprache, deutsch) +'">'
                     +  '<input type="checkbox" value="'+fremdsprache+'" data-mini="true" '
                     +  'id="vokabel-'+ id(fremdsprache, deutsch) +'">' + fremdsprache + ' – ' + deutsch + '</label>';
    });

    $('#vokabelverw-liste').append(controlGroup).trigger('create');
    $('#vokabelverw-div-vokListe').prepend(pfad);
    
    if(controlGroup != '')  $('#vokabelverw-h2-keineVokabeln').hide();
    else                    $('#vokabelverw-h2-vokabelnWaehlen').hide();
    
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
});

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
    
    $('#neueKartei-div-warnung').hide();
    $('#neueKartei-div-hinweis').hide();

    var collapsible = '';
    var spracheToggle = null;
     
    collapsible += '<div data-role="collapsible"><h3>Sprachen wählen</h3><form><fieldset data-role="controlgroup">';   
    $.each(sprachen, function(sprache) {
        collapsible += '<label for="neueKartei-coll-sprachenListe-radio-' + sprache + '">'
                    +  '<input type="radio" id="neueKartei-coll-sprachenListe-radio-' + sprache + '" value="' + sprache + '">'
                    + sprache + '</label>';
    });
    collapsible += '</fieldset></form></div>';

    $('#neueKartei-coll-sprachenListe').append(collapsible);
    $('#neueKartei-coll-sprachenListe').collapsibleset('refresh').trigger('create');
    
    if($.isEmptyObject(sprachen))   $('#neueKartei-coll-sprachenListe').hide(); // Noch keine Sprachen vorhanden
    
    $('#neueKartei-coll-sprachenListe').on('collapsibleexpand', function(){     // "Sprache wählen" wird betätigt
        console.log("Knut");
        $('#neueKartei-btn-spracheHinzu').slideUp();
        spracheToggle = true;
    });

    $('#neueKartei-coll-sprachenListe').on('collapsiblecollapse', function(){     // "Sprache wählen" wird betätigt
        $('#neueKartei-btn-spracheHinzu').slideDown();
        spracheToggle = false;
    });
    
    $('#neueKartei-btn-spracheHinzu').click( function(){      // "Sprache hinzufügen" wird betätigt
        $('#neueKartei-div-spracheHinzu').fadeToggle();
        if(!$.isEmptyObject(sprachen))  $('#neueKartei-coll-sprachenListe').slideToggle();
        spracheToggle = false;
    });

    $('#neueKartei-btn-karteiSpeichern').on('click', function() {

        var sprache = '';
        var kartei = '';

        if(spracheToggle === true) { // aus der Liste
            sprache = $('#neueKartei-coll-sprachenListe').find(':checked');
            if(sprache.length == 0) {
                $('#neueKartei-div-warnung').fadeIn(500);
                $('#neueKartei-coll-sprachenListe').addClass('div-markiert');
                $('#neueKartei-coll-sprachenListe').find(':radio').on('click', function(){  // Sobald ein Radiobutton geklickt wird, verschwindet der Hinweis
                    $('#neueKartei-div-warnung').fadeOut(500);
                    $('#neueKartei-coll-sprachenListe').removeClass('div-markiert');
                });
                return;
            }
            aktuelleSprache = sprache.val();
            sprache = sprache.val(); // bufix
        }
        else if(spracheToggle === false) {
            sprache = $('#neueKartei-input-sprache').val();
            if(sprache === '') {
                $('#neueKartei-div-warnung').fadeIn(500);
                $('#neueKartei-input-sprache').addClass("inputText");
                $('#neueKartei-div-content').find('#neueKartei-input-sprache').on('click', function(){  // Sobald das input-field (Sprache) geklickt wird, verschwindet der Hinweis
                    $('#neueKartei-div-warnung').fadeOut(500);
                    $('#neueKartei-input-sprache').removeClass("inputText");
                });
                return;
            }
            aktuelleSprache = sprache;
        }
        else {
            $('#neueKartei-div-warnung').fadeIn(500).delay(2000).fadeOut(500);  // Das ist eher eine Notlösung  
            return;
        }

        var kartei = $('#neueKartei-input-kartei').val();
        if(kartei === '') {
            $('#neueKartei-div-warnung').fadeIn(500);
            $('#neueKartei-input-kartei').addClass("inputText");
            $('#neueKartei-div-content').find('#neueKartei-input-kartei').on('click', function(){   // Sobald das input-field (Kartei) geklickt wird, verschwindet der Hinweis
                $('#neueKartei-div-warnung').fadeOut(500);
                $('#neueKartei-input-kartei').removeClass("inputText");
            });
            return;
        }

        // und zum Schluss einfügen in die Sprachen
        if(sprachen[sprache] === undefined) {
            sprachen[sprache] = {};
        }
        sprachen[sprache][kartei] = {};

        // sprachen in sprachen.js festschreiben
        app.writeFile(function() {
            zeigeInfo = true;
            $('#neueKartei-div-hinweis').fadeIn(500).delay(2000).fadeOut(500);
        });
    });
});

$('#NeueVokabel').on('pagebeforeshow', function(event, ui) {
    $('#neueVokabel-btn-vokabelSpeichern').off();
    $('#neueVokabel-input-deutsch').off();
    $('#neueVokabel-input-uebersetzung').off();

    $('#neueVokabel-input-deutsch').val('');
    $('#neueVokabel-input-uebersetzung').val('');
    
	$('#neueVokabel-div-warnung').hide();
    $('#neueVokabel-div-hinweis').hide();

    var ueberschrift = aktuelleSprache + ' – ' + aktuelleKartei;
    $('#neuevokabel-div-content > h2').empty().append(ueberschrift);

    $('#neueVokabel-btn-vokabelSpeichern').on('click', function() {
        var deutsch = $('#neueVokabel-input-deutsch').val();
        var uebersetzung = $('#neueVokabel-input-uebersetzung').val();

        if(deutsch === '') {
            $('#neueVokabel-div-warnung').fadeIn(500);
            $('#neueVokabel-input-deutsch').addClass("inputText");
            $('#neuevokabel-div-content').find('#neueVokabel-input-deutsch').on('click', function(){
                $('#neueVokabel-div-warnung').fadeOut(500);
                $('#neueVokabel-input-deutsch').removeClass("inputText");
            });
            return;
        }
        
        if(uebersetzung === '') {
            $('#neueVokabel-div-warnung').fadeIn(500);
            $('#neueVokabel-input-uebersetzung').addClass("inputText");
            $('#neuevokabel-div-content').find('#neueVokabel-input-uebersetzung').on('click', function(){
                $('#neueVokabel-div-warnung').fadeOut(500);
                $('#neueVokabel-input-uebersetzung').removeClass("inputText");
            });
            return;
        }

        sprachen[aktuelleSprache][aktuelleKartei][uebersetzung] = {};
        sprachen[aktuelleSprache][aktuelleKartei][uebersetzung] = deutsch;
        app.writeFile(function() {
            zeigeInfo = true;
            $('#neueVokabel-div-hinweis').fadeIn(500).delay(2000).fadeOut(500);
        });
    });
});

$('#Lernen').on('pageshow', function(event, ui) {
	var anzVokabeln = anzahlVokabeln(aktuelleSprache, aktuelleKartei);
	var vokabeln = vokabelArray(aktuelleSprache, aktuelleKartei, anzVokabeln);	// Vokabeln werden als 2-Dim Array gespeichert
	var ueberschrift = aktuelleSprache + ' – ' + aktuelleKartei;

	//zurücksetzen
	punkte = 0;	
	varZeit = '';
	sprachenUmkehren = false;
	$('#lernen-btn-richtung').off().text('Fremdsprache - Deutsch');
	
	$('#lernen-div-anzahl').html('Anzahl: 0 / ' + anzVokabeln);
	$('#lernen-div-content > h2').html(ueberschrift);

	$('#lernen-btn-richtung').click( function(){	// Lern-Richtung wird umgekehrt
		sprachenUmkehren = (sprachenUmkehren == false) ? true : false;
		$(this).text(function(i, text){
			return text === "Fremdsprache - Deutsch" ? "Deutsch - Fremdsprache" : "Fremdsprache - Deutsch";
		});
	});

	$('#lernen-btn-start').click( function(){
		$('#lernen-btn-start').fadeOut(500);
		$('#lernen-btn-richtung').fadeOut(500);
		var timerID = zeit();
		lernen(0, 0, 1, anzVokabeln, vokabeln, timerID);
	});
});

$('#Lernfortschritt').on('pageshow', function(event, ui) {
	alert(aktuelleSprache + ' - ' + aktuelleKartei + ': ' + varZeit + ' Minuten, ' +punkte + '%');
});

$('#SpracheLoeschenDialog').on('pagebeforeshow', function(){
    $('#spracheLoeschen-btn-loeschen').on('click', function() {
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
            zeigeInfo = true;
            // hier müssten wir noch prüfen, ob das Schreiben geklappt hat, oder nicht
            $('#karteiverw-div-hinweis').show().delay(2000).fadeOut(500);
        });
    });
});

$('#VokabelLoeschenDialog').on('pagecreate', function(){
    $('#vokabelLoeschen-btn-loeschen').click( function(){
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
            // hier müssten wir noch prüfen, ob das Schreiben geklappt hat, oder nicht
            zeigeInfo = true;
            $('#vokabelverw-div-hinweis').show().delay(2000).fadeOut(500);
        });
    });
});

// erstellt eine ID bestehend aus den übergebenen Parametern
function id(sprache, kartei, vokabel) {
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
    // ersetze Leerzeichen (s = spaces) mit Bindestrichen
    return r.replace(/\s/g, '-');
}

function anzahlVokabeln(sprache, kartei){
	var anzahlVokabeln =0;
	$.each(sprachen[sprache][kartei], function() {
		++anzahlVokabeln;
	});
	return anzahlVokabeln;
}

function vokabelArray(sprache, kartei, anzahlVokabeln){
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
	return vokabelnArray
}

function lernen(x, y, vokNr, anzVokabeln, vokabeln, timerID){		// Die Methode ist echt hässlich und vollgestopft. evtl noch mal überarbeiten.
	$('#lernen-btn-pruefen').off();
	$('#lernen-div-anzahl').html('Anzahl: ' + vokNr + ' / ' + anzVokabeln);
	if(!sprachenUmkehren)	$('#lernen-div-karteHead p').html(vokabeln[x][y]);
	else					$('#lernen-div-karteHead p').html(vokabeln[x][++y]);
    
	$('#lernen-btn-pruefen').click( function(){	
		if(sprachenUmkehren)		y = (-1);
		var val = $('#lernen-input-loesung').val();
		var vok = vokabeln[x][++y];

		if(val === vok){								// Richtige Lösung wurde eingegeben (2 Punkte hierfür)
			punkte += 2;
			$('#lernen-div-karteBody p').html('Richtig! :)');
			$('#lernen-div-footLinks').addClass('richtig');
			$('#lernen-div-karteBody p').fadeIn(500).delay(2000).fadeOut(500);
			setTimeout(function(){
				$('#lernen-div-footLinks').removeClass('richtig');
				pruefeAnzahl(x, vokNr, anzVokabeln, vokabeln, timerID);
			}, 3000);
		}
		else if(soundex(val) === soundex(vok)){			// Ähnliche Lösung wurde eingegeben (1 Punkt hierfür)
			console.log('y: ' + y);
			punkte++;
			if(sprachenUmkehren)		y = 0;
			$('#lernen-div-karteBody p').html('Fast! Richtige Lösung: ' + vokabeln[x][y]);
			$('#lernen-div-footLinks').addClass('fast');
			$('#lernen-div-karteBody p').fadeIn(500).delay(2000).fadeOut(500);
			setTimeout(function(){
				$('#lernen-div-footLinks').removeClass('fast');
				pruefeAnzahl(x, vokNr, anzVokabeln, vokabeln, timerID);
			}, 3000);
		}
		else{											// Falsche Lösung wurde eingegeben (0 Punkte hierfür)
			if(sprachenUmkehren)		y = 0;													
			$('#lernen-div-karteBody p').html('Leider falsch! Lösung: ' + vokabeln[x][y]);
			$('#lernen-div-footRechts').addClass('falsch');
			$('#lernen-div-karteBody p').fadeIn(500).delay(2000).fadeOut(500);
			setTimeout(function(){
				$('#lernen-div-footRechts').removeClass('falsch');
				pruefeAnzahl(x, vokNr, anzVokabeln, vokabeln, timerID);
			 }, 3000);
		}
	});
}

// Hilfsfunktion für lernen-Methode. prüft, ob noch Vokabeln vorhanden und leitet weitere Schritte ein.
function pruefeAnzahl(x, vokNr, anzVokabeln, vokabeln, timerID){
	if(vokNr < anzVokabeln){
		lernen(++x, 0, ++vokNr, anzVokabeln, vokabeln, timerID);
	}
	else{				// Keine Vokabeln mehr vorhanden
		$('#lernen-btn-start').fadeIn(500);
		$('#lernen-btn-richtung').fadeIn(500);
		clearInterval(timerID);
		timerID = null;
		punkte = parseInt(punkte / (anzVokabeln * 2) * 100);
		varZeit = $('#lernen-div-zeit').html();
		window.location = '#Lernfortschritt';		// Weiterleitung auf den Lernfortschritt, wenn kartei fertig gelernt
	}
}

// Gibt die Zeit im Lernmodus aus
function zeit(){
	var minuten = 0;
	var sekunden = 0;
	var timerID = setInterval(function(){
		if(sekunden < 59)	sekunden++;
		else				sekunden = 0;
		if(sekunden == 0)	minuten++;
		$('#lernen-div-zeit').html('Zeit: ' + minuten + ':' + sekunden);
	}, 1000);
	return timerID;
}

// zum Vergleichen, ob Wörter ähnlich sind
var soundex = function (s) {
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
};  
