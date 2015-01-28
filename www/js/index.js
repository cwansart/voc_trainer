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
    var listView = '';
    $.each(sprachen, function(sprache) {
        listView += '<li><a href="#Karteiverwaltung2">' + sprache + '</a></li>';
    });
    $('#kartei-sprachen-liste').append(listView);
    $('#kartei-sprachen-liste').listview('refresh');

    if(listView != '') {
        $('#kartei-sprachen').children()[0].setAttribute('style', 'display:none;');
        $('#kartei-sprachen').children()[1].setAttribute('style', 'display:block;');
    }

    // Wenn die Sprache angeklickt wird, wird die Sprache in der globalen Variable "aktuelleSprache" gesetzt.
    $('#kartei-sprachen-liste > li').on('click', function() {
        aktuelleSprache = $(this).text();
    });
});

$('#Karteiverwaltung2').on( 'pagecreate', function( event, ui ) {
    if(aktuelleSprache == null) return;

    var listView = '';
    $.each(sprachen[aktuelleSprache], function(kartei) {
        listView += '<li><a href="#Karteiverwaltung3">' + kartei + '</a></li>';
    });
    $('#kartei-karteien-liste').append(listView);
    $('#kartei-karteien-liste').listview('refresh');

    if(listView != '') {
        $('#kartei-karteien').children()[0].setAttribute('style', 'display:none;');
        $('#kartei-karteien').children()[1].setAttribute('style', 'display:block;');
    }

    // Wenn die Kartei angeklickt wird, wird die Kartei in der globalen Variable "aktuelleKartei" gesetzt.
    $('#kartei-karteien-liste > li').on('click', function() {
        aktuelleKartei = $(this).text();
    });
});

$('#Karteiverwaltung3').on( 'pagecreate', function( event, ui ) {
    if(aktuelleKartei == null) return;

    var listView = '';
    var vokabeln = sprachen[aktuelleSprache][aktuelleKartei];
    for(var i in vokabeln) {
        $.each(vokabeln[i], function(vokabel, uebersetzung) {
            listView += '<li><a href="#Karteiverwaltung4">' + vokabel + ' – ' + uebersetzung + '</a></li>';
        });
    }

    $('#kartei-vokabeln-liste').append(listView);
    $('#kartei-vokabeln-liste').listview('refresh');

    if(listView != '') {
        $('#kartei-vokabeln').children()[0].setAttribute('style', 'display:none;');
        $('#kartei-vokabeln').children()[1].setAttribute('style', 'display:block;');
    }

    // Wenn die Kartei angeklickt wird, wird die Kartei in der globalen Variable "aktuelleKartei" gesetzt.
    $('#kartei-vokabeln-liste > li').on('click', function() {
        aktuelleVokabel = $(this).text();
        alert("DÖDÖÖÖM");
        return;
    });
});