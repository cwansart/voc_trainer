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
// Hier werden Datei"global" die Sprachen gespeichert aus der data/sprachen.json
var sprachen = {};
var sprachenGeladen = false;
var aktuelleSprache = null;
var aktuelleKartei = null;
var aktuelleVokabel = null;

var app = {
    // Application Constructor
    initialize: function() {
        this.bindEvents();
        sprachenLaden();
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
    }
};

app.initialize();

// Beim Laden der App, Sprachen-Datei einlesen. Diese Funktion muss für die App noch in the app.onDeviceReady verschoben werden.
$(document).ready(function() {
    sprachenLaden();
    $.mobile.defaultPageTransition = 'slidefade';
});

function sprachenLaden() {
    console.log("sprachen laden");
    if(sprachenGeladen) return;
    $.getJSON('data/sprachen.json', function( data ) {
        sprachen = data;
    });
    sprachenGeladen = true;
}

$('#Karteiverwaltung').on('pagecreate', function(event, ui) {
    $('#karteiverw-btn-loeschen').hide();
    $('#karteiverw-btn-lernen').hide();
    $('#karteiverw-btn-oeffnen').hide();
    
    var collapsible = '';
    $.each(sprachen, function(sprache) {
        collapsible += '<div data-role="collapsible" data-iconpos="right" data-sprache="' + sprache + '"><h3>' + sprache + '</h3>'
                    +  '<fieldset data-role="controlgroup">';   //div noch schließen
        
        $.each(sprachen[sprache], function(kartei) {
            collapsible += '<label for="kartei-'+sprache+'-'+kartei+'"><input type="checkbox" data-mini="true" name="kartei-'+sprache+'-'+kartei+'" id="kartei-'+sprache+'-'+kartei+'">' + kartei + '</label>';
        });
        
        collapsible += '</fieldset></div>';
    });

    $('#karteiverw-coll-sprachenListe').append(collapsible);
    $('#karteiverw-coll-sprachenListe').collapsibleset('refresh').trigger("create");

    if(collapsible != '') {
        $('#karteiverw-div-sprachen').children()[0].setAttribute('style', 'display:none;');
        $('#karteiverw-div-sprachen').children()[1].setAttribute('style', 'display:block;');
    }
    
    // ausgewählte/ausgeklappte Sprache speichern
    $('#karteiverw-coll-sprachenListe').children().on('collapsibleexpand', function(event, ui) {
        aktuelleSprache = $(this).attr('data-sprache');
    });

    $('#karteiverw-coll-sprachenListe').children().find(':checkbox').on('click', function() {
        var einAusblendeGeschw = 400;
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
                break;
            default:
                $('#karteiverw-btn-loeschen').show(einAusblendeGeschw);
                $('#karteiverw-btn-lernen').hide(einAusblendeGeschw);
                $('#karteiverw-btn-oeffnen').hide(einAusblendeGeschw);
                break;
        }
    })
});

$('#NeueKartei').on('pagecreate', function(event, ui) {
    $('#neueKartei-div-spracheHinzu').hide();
    
     var collapsible = '';
     
    collapsible += '<div data-role="collapsible"><h3>Sprachen wählen</h3><form>';   
    $.each(sprachen, function(sprache) {
        collapsible += '<p><input type="radio" name="Sprache" value="' + sprache + '">' + sprache + '</p>'; // Geht das so?
    });
    collapsible += '</form></div>';

    $('#neueKartei-coll-sprachenListe').append(collapsible);
    $('#neueKartei-coll-sprachenListe').collapsibleset('refresh');
    
    $('#neueKartei-coll-sprachenListe > div > h3').click( function(){     // "Sprache hinzufügen" wird betätigt
        $('#neueKartei-btn-spracheHinzu').slideToggle();
    });
    
    $('#neueKartei-btn-spracheHinzu').click( function(){      // "Sprache wählen" wird betätigt
        $('#neueKartei-div-spracheHinzu').fadeToggle();
        $('#neueKartei-coll-sprachenListe').slideToggle();
    });
});
