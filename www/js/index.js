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
        var parentElement = document.getElementById(id);
        var listeningElement = parentElement.querySelector('.listening');
        var receivedElement = parentElement.querySelector('.received');

        listeningElement.setAttribute('style', 'display:none;');
        receivedElement.setAttribute('style', 'display:block;');

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
                // Ab hier könnte der Splashscreen wieder deaktiviert werden.
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
                break;
            default:
                // alle Fehlercodes auf: https://developer.mozilla.org/en-US/docs/Web/API/FileError#Error_codes
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
	$('#karteiverw-div-hinweis').hide();	// verstecken sämtlicher Inhalte, die anfangs nicht erscheinen sollen.
    $('#karteiverw-btn-loeschen').hide();
    $('#karteiverw-btn-lernen').hide();
    $('#karteiverw-btn-oeffnen').hide();
	$('#vokabelverw-btn-loeschen').hide();
    $('#vokabelverw-div-hinweis').hide();
	$('#neueKartei-div-spracheHinzu').hide();
    $('#neueKartei-div-warnung').hide();
    $('#neueKartei-div-hinweis').hide();
	$('#neueVokabel-div-warnung').hide();
    $('#neueVokabel-div-hinweis').hide();
});

function sprachenLaden() {
    console.log("sprachen laden");
    if(sprachenGeladen) return;
    $.getJSON('data/sprachen.json', function( data ) {
        sprachen = data;
    });
    sprachenGeladen = true;
}

$('#Karteiverwaltung').on('pageshow', function(event, ui) {
    $('#Karteiverwaltung').children().off();
    $('#karteiverw-coll-sprachenListe').children().off();
    $('#karteiverw-coll-sprachenListe').children().find(':checkbox').off();
    
    $('#karteiverw-coll-sprachenListe').empty();

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
        console.log(anzahlAusgewaehlt);
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
    })
});

$('#Vokabelverwaltung').on( 'pageshow', function( event, ui ) { 
    $('#vokabelverw-div-vokListe').children().find(':checkbox').off();

    $('#vokabelverw-liste').empty();

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

$('#NeueKartei').on('pageshow', function(event, ui) {
    $('#neueKartei-coll-sprachenListe').off();
    $('#neueKartei-btn-spracheHinzu').off();
    $('#neueKartei-input-kartei').off();
    $('#neueKartei-input-sprache').off();

    $('#neueKartei-coll-sprachenListe').empty();
    $('#neueKartei-input-kartei').val('');
    $('#neueKartei-input-sprache').val('');

    $('#neueKartei-coll-sprachenListe').show();
    $('#neueKartei-btn-spracheHinzu').show();
    
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
            $('#neueKartei-div-hinweis').fadeIn(500).delay(2000).fadeOut(500);
        });
    });
});

$('#NeueVokabel').on('pageshow', function(event, ui) {
    $('#neueVokabel-btn-vokabelSpeichern').off();
    $('#neueVokabel-input-deutsch').off();
    $('#neueVokabel-input-uebersetzung').off();

    $('#neueVokabel-input-deutsch').val('');
    $('#neueVokabel-input-uebersetzung').val('');
    
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
            $('#neueVokabel-div-hinweis').fadeIn(500).delay(2000).fadeOut(500);
        });
    });
});

$('#Lernen').on('pagecreate', function(event, ui) {
    var ueberschrift = aktuelleSprache + ' – ' + aktuelleKartei;
    $('#lernen-div-content > h2').append(ueberschrift);
});

$('#SpracheLoeschenDialog').on('pagecreate', function(){
    $('#spracheLoeschen-btn-loeschen').click( function(){
            $('#karteiverw-div-hinweis').show().delay(2000).fadeOut(500);
    });
});

$('#VokabelLoeschenDialog').on('pagecreate', function(){
    $('#vokabelLoeschen-btn-loeschen').click( function(){
        $('#vokabelverw-div-hinweis').show().delay(2000).fadeOut(500);
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
