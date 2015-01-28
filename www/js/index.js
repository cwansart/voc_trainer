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

var app = {
    // Application Constructor
    initialize: function() {
        this.bindEvents();
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

/** Zum Arbeiten im Browser ist der jQuery-Code hier, muss aber anschließend in die onDeviceReady
  * Funktion verschoben werden!
  */
$( "#Karteiverwaltung" ).on( "pagecreate", function( event, ui ) {
    /*
     * TODO: Die Datei muss nur einmal ganz am Anfang geladen werden. Der Rest sollte
     * über die "sprachen"-Variable ablaufen.
     * !!! Wir können die sprachen.json auch im Ladebildschirm laden !!!
     */
    $.getJSON("data/sprachen.json", function( data ) {
        sprachen = data['sprachen'];

        var listView = '';
        $.each(sprachen, function(i, sprache) {
            listView += '<li>' + sprache['sprache'] + '</li>';
        });

        $("#kartei-sprachen-liste").append(listView);
        $("#kartei-sprachen-liste").listview( "refresh" );

        $("#kartei-sprachen").children()[0].setAttribute('style', 'display:none;');
        $("#kartei-sprachen").children()[1].setAttribute('style', 'display:block;');
    });
});

/* Kartei-hinzufügen - Page*/
$( "#NeueKartei" ).on( "pagecreate", function( event, ui ) {
		$("#kartei-hinzu-sprachen").hide();
		$("#div-sprache-hinzu").hide();
	
		$.getJSON("data/sprachen.json", function( data ) {
		sprachen = data['sprachen'];

		var checkList = '<br>';
		$.each(sprachen, function(i, sprache) {
			checkList += '<label for="radio-choice">' + sprache['sprache'] + '</label>';
		});
		checkList += '<br>';
		
		/*refresh läuft noch nicht!!*/
		$('#kartei-hinzu-sprachen-liste').append(checkList);
		$('#kartei-hinzu-sprachen [data-role="fieldcontain"]').fieldcontain('refresh');
		$('#kartei-hinzu-sprachen-liste [data-role="controlgroup"]').controlgroup('refresh', true);
    });

	$("#sprache-waehlen").click( function(){
		$("#kartei-hinzu-sprachen").slideToggle();
	});
	
	$("#sprache-hinzu").click( function(){
		$('#div-sprache-hinzu').slideToggle();
	});
});

app.initialize();

