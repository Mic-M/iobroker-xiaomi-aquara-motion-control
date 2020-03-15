/*******************************************************************************
 * Bewegungsmelder-Script: Schaltung Lichter/Geräte mittels Bewegungsmelder.
 * ----------------------------------------------------
 * In das Script lassen sich beliebig viele Xiaomi Aqara Bewegungsmelder einbinden. Getestet mit Adapter mihome und zigbee.
 * Sicherlich lassen sich auch Bewegungsmelder anderer Hersteller einbinden, siehe hierzu ADAPTER_STATES unten.
 * Hiweis: Es werden keinerlei Datenpunkte angelegt, da wir diese nicht benötigen.
 * ----------------------------------------------------
 * Autor: ioBroker-Forum-Name: Mic / Github-Name: Mic-M
 * Source:  https://github.com/Mic-M/iobroker.xiaomi-aquara-motion-control
 * Support: https://forum.iobroker.net/topic/22034/
 * ----------------------------------------------------
 * Change Log:
 *  2.0 Mic - Complete recoding. Also, addition of several options, etc.
 *  0.4 Mic - Allow using Zigbee adapter and others as well.
 *  0.3 Mic - few code improvements
 *  0.2 Mic - Fix: Compare Time
 *  0.1 Mic - Initial Release
 ******************************************************************************/



/*******************************************************************************
 * Konfiguration
 ******************************************************************************/

/////////////////////
// Hier die einzelnen Bewegungssensoren anlegen und einstellen.
// Im ersten Beispiel ist alles im Detail beschrieben.
/////////////////////
const MOTION_SENSORS = [
  {
    // Beliebiger Name (für Log-Ausgabe). Bitte individuell vergeben.
    name:                   'Gästezimmer',

    // Haupt-Datenpunkt des Bewegungsmelders, z.B. "mihome.0.devices.sensor_motion_aq2_1234567abcde" oder "zigbee.0.00123456789415"
    // Es werden auch mehrere Sensoren unterstützt, d.h. etwa 3 Bewegungsmelder im Flur.
    sensorState:            'mihome.0.devices.sensor_motion_aq2_11111111111111',
//    sensorState:            ['mihome.0.devices.sensor_motion_aq2_XXXXXXXXXXX', 'zigbee.0.XXXXXXXXXXXXX', 'zigbee.0.YYYYYYYYYYYYYYYYYYYYY'],

    // Hier beliebig viele Schaltzeitpunkte hinzufügen (period_1, period_2, period_3, usw.)
    //  - "start" und "end": Erforderlich. Es wird geprüft, ob start/end innerhalb aktueller Uhrzeit ist, wenn Bewegungsmelder auslöst.
    //                       Astro-Zeitangaben sind erlaubt, also etwa 'sunrise' oder mit einem Offset wie {astro: 'sunrise', offset: -30}
    //                       Details zu start/end und Astro-Zeitangaben: https://github.com/ioBroker/ioBroker.javascript/blob/master/docs/en/javascript.md#comparetime
    // - "days":             OPTIONAL: Wenn weggelassen, wird jeden Tag geschaltet (Montag-Sonntag). 
    //                       Montag = 1, Dienstag = 2, ... Sonntag = 7. 
    //                       Mehrere Tage mit Komma trennen, z.B. '1, 3, 5' für Montag/Mittwoch/Freitag.
    //                       Periodische Angaben wie '2-4' für Dienstag/Mittwoch/Donnerstag sind auch möglich.
    //                       Ebenso Kombination einzelner Tage und Periode möglich, z.B. '2-4, 7' für Dienstag/Mittwoch/Donnerstag und Sonntag.
    // - "sec":              OPTIONAL: Nach wie vielen Sekunden soll wieder ausgeschalten werden? Falls weggelassen oder 0, dann wird nicht ausgeschaltet.
    // - "lux"               OPTIONAL: Ab wieviel Lux soll NICHT eingeschaltet werden? Falls weggelassen oder größer 9999, dann wird unababhängig von den gemessenen Lux immer eingeschaltet.
    // - "luxAlways"         OPTIONAL: Wir gehen davon aus, dass Lampen geschaltet werden. Ist eine Lampe an, wird ein größerer Lux-Wert vom Sensor gemessen, daher macht die Prüfung auf Lux bei  
    //                                 bereits eingeschalteter Lampe auf erneute Bewegung und Lux-Abfrage keinen Sinn mehr. Daher wird durch dieses Script bei Bewegung
    //                                 -- während das Gerät (die Lampe) an ist -- die Lux-Erkennung hier deaktiviert. Zum dauerhaften aktivieren auf "true" setzen, damit wird immer auf Lux geprüft, 
    //                                 auch wenn das Gerät an ist.
    period_1:               {start:'sunsetStart', end:'21:30', days:'2-4, 7',   sec:120,     lux:90,    luxAlways:false},

    // Hier den Datenpunkt des Gerätes angeben, das geschaltet werden soll bei Bewegung an und wieder aus.
    // Falls als String gesetzt, z.B. 'javascript.0.Licht.Schlafzimmer.Switch', muss Datenpunkt muss von Typ "Boolean" (true/false) sein.
    //
    // Es sind noch deutlich mehr Optionen möglich, hierzu muss als Objekt gesetzt werden: {on:{state:'fullybrowser.0.X_X_X_X.Commands.screenOn', cmd:true}, off:{state:'fullybrowser.X_X_X_X.Commands.screenOff', cmd: true}, checkOnOffStatusState:'fullybrowser.X_X_X_X.Info.isScreenOn'}
    // Dadurch ist folgendes möglich:
    // 1. Individuellen State für An/Aus setzen, Beispiel: {on:{state:'javascript.0.Wohnzimmer.Licht.Szene', cmd:'Entspannen'}, off:{state:'shelly.0.XXXXXXXXXX.Relay0.Switch', cmd: false}, checkOnOffStatusState:'shelly.0.XXXXXXXXXX.Relay0.Switch'}
    // 2. Ausschalten deaktivieren (es wird also nur eingeschaltet): Einfach den Teil "off:{state:'fullybrowser.X_X_X_X.Commands.screenOff', cmd: true}," rauslöschen.
    // 3. Individuellen State zur Erkennung, ob Gerät an oder aus ist setzen: checkOnOffStatusState:'fullybrowser.X_X_X_X.Info.isScreenOn'. Dies ist notwenig, wenn "on:{state" nicht Boolean (true/false) ist.
    //target:                 {on:{state:'hue.0.R_Schlafzimmer.on', cmd:true}, off:{state:'hue.0.R_Schlafzimmer.on', cmd: false}, checkOnOffStatusState:'hue.0.R_Schlafzimmer.on'},
    target:                 'hue.0.R_Gästezimmer.on',

    // Optional: In manchen Fällen will man ggf. mit dem Bewegungsmelder nur einmalig einschalten. Dann soll der Bewegungsmelder x Sekunden (z.B. 10 Minuten = 600s) nicht mehr neu auslösen.
    //           Dazu hier den Wert in Sekunden entsprechend setzen. Durch weglassen oder wait:0 wird das ignoriert. 
    wait:                0,

    // Optional: Nicht schalten: Wenn einer der folgenden Datenpunkte mit dem Wert übereinstimmt, wird nicht geschaltet.
    //           Hilfreich, um z.B. nicht zu schalten, wenn keiner anwesend ist, oder etwa ein Fenster offen ist, etc.
    //           Es können beliebig viele States hinzugefügt werden (neverState_1, neverState_2, neverState_3 usw.)
    neverState_1:           {state:'0_userdata.0.Anwesenheit.Status.anyonePresent', val:false},
  }, 
  
   //
   // Hier nun weitere Beispiele, ohne weiterer Erläuterung (da oben bereits beschrieben).
  
  {
    name:                   'Flur',
    sensorState:            ['mihome.0.devices.sensor_motion_aq2_XXXXXXXXXXX', 'zigbee.0.XXXXXXXXXXXXX'], // wir überwachen hier 2 Bewegungsmelder gleichzeitig
    period_1:               {start:'0:00', end:'23:59',    sec:130 },
    neverState_1:           {state:'0_userdata.0.Anwesenheit.Status.anyonePresent', val:false},
    target:                'shelly.0.SHSW-1#XXXXX#1.Relay0.Switch',
  }, 
  {
    name:                   'Küche',
    sensorState:            'mihome.0.devices.sensor_motion_aq2_xxxxxxxxxxxx',
    period_1:               {start:'7:00', end:'23:00',    sec:120, lux:10 },
    neverPeriod_1:          {start:'goldenHourEnd', end:'goldenHour', days:'1-7'},
    neverState_1:           {state:'0_userdata.0.Anwesenheit.Status.anyonePresent', val:false},
    target:                 'shelly.0.SHSW-1#XXXXX#1.Relay0.Switch',
    wait:                   300,
  }, 
  {
    name:                   'Bad',
    sensorState:            'zigbee.0.xxxxxxxxxxxx',
    period_1:               {start:'6:00', end:'09:00',    sec:240, lux:150 },
    period_2:               {start:'9:00', end:'23:00',    sec:120, lux:150 },
    neverPeriod_1:          {start:'12:00', end:{astro:'goldenHour', offset: -30} },
    neverState_1:           {state:'0_userdata.0.Anwesenheit.Status.anyonePresent', val:false},
    target:                 'shelly.0.SHSW-1#XXXXX#1.Relay0.Switch',
  }, 
  {
    name:                   'Tablet',
    sensorState:            'zigbee.0.xxxxxxxxxxxxxx',
    period_1:               {start:'7:00', end:'23:00',  days:'1-4',  sec:600 },
    period_2:               {start:'7:00', end:'24:00',  days:'5',  sec:600 },
    period_3:               {start:'0:00', end:'02:00',  days:'6',  sec:600 },
    period_4:               {start:'7:00', end:'24:00',  days:'6',  sec:600 },
    period_5:               {start:'0:00', end:'02:00',  days:'7',  sec:600 },
    period_6:               {start:'7:00', end:'23:00',  days:'7',  sec:600 },
    neverState_1:           {state:'0_userdata.0.Anwesenheit.Status.anyonePresent', val:false},
    target:                 {on:{state:'fullybrowser.0.10_10_0_129.Commands.screenOn', cmd:true}, off:{state:'fullybrowser.0.10_10_0_129.Commands.screenOff', cmd: true}, checkOnOffStatusState:'fullybrowser.0.10_10_0_129.Info.isScreenOn'},
  }, 
];


/*******************************************************************************
 * Optionale weitere Einstellungen
 ******************************************************************************/

// Die Datenpunkte der einzelnen Adapter (mihome, zigbee, etc.) unterscheiden sich, daher definieren wir diese hier.
// Es können weitere Adapter hinzugefügt werden.
// - Erster Teil (z.B. "mihome"): Hauptdatenpunkt ohne Instanz. Also bei mihome.0 ist das einfach nur "mihome".
// - stateMotion: Der Datenpunkt, der eine neue Bewegung erfasst und dann auf true setzt. z.B. [mihome.0.devices.sensor_motion_aq2_123456789abc.state]
//                Hier dann nur den Teil nach dem letzten Punkt nehmen, also hier "state"
// - stateLux:    Der Datenpunkt, der die Lux (Helligkeit) anzeigt. Kann man weglassen, dann wird Lux nicht berücksichtigt.
//                Z.B. [mihome.0.devices.sensor_motion_aq2_123456789abc.lux]. -> Nur den Teil nach dem letzten Punkt nehmen, also hier "lux"
const ADAPTER_STATES = {
        mihome: {stateMotion: 'state',     stateLux: 'lux'},
        zigbee: {stateMotion: 'occupancy', stateLux: 'illuminance'},
};


// Logeinträge: Infos zeigen (wenn eingeschaltet oder ausgeschaltet wurde)
const INFO = true;

// Logeinträge: Zusätzliche Einträge anzeigen zur Fehlerbehebung. Auf "false" setzen, wenn alles funktioniert.
const DEBUG = false;


/*************************************************************************************************************************
 * Ab hier nichts mehr ändern / Stop editing here!
 *************************************************************************************************************************/


/****************************************************************************
 * Global variables and constants
 ****************************************************************************/
let G_Timers = []; // Timer for each motion sensor (sensors as configured above). Key is 'name' of config.
let G_WaitTimers = []; // Wait Timers
let G_Sensornames = []; // All names of the sensors in this array. For logging...


/****************************************************************************
 * First, we are validating the configuration
 ****************************************************************************/
validate();
function validate() {

    let errorCount = 0;

    if (DEBUG) log('[DEBUG] ' + 'VALIDIERUNG *** START: Prüfung der Script-Konfiguration ***');
    for (const LPCONF of MOTION_SENSORS) {

        if (isLikeEmpty(LPCONF.name)) {
            log('"name" wurde nicht gesetzt in Script-Konfiguration.', 'warn');
            errorCount++;
        } else {
            G_Sensornames.push(LPCONF.name); // For logging
        }

        /////////////////////////////////////////////////////
        // 1. Check if adapters in MOTION_SENSORS are matching with ADAPTER_STATES
        // We use sensorState() function to check
        /////////////////////////////////////////////////////
        let sensorStateArray = [];         // We are allowing multiple sensors for one area.
        if (typeof LPCONF.sensorState == 'string') {
            sensorStateArray.push(LPCONF.sensorState); // If we just have one sensor as string
        }
        for (const lpSensorStatePath of sensorStateArray) {
            if(sensorState(LPCONF.sensorState, 'stateMotion') == 'ERROR') {
                log('Konfiguration von Bewegungsmelder ' + LPCONF.name + ': Adapter/Datenpunkt [' + lpSensorStatePath.split('.')[0] + '] ist NICHT korrekt definiert.', 'warn');
                errorCount++;
            } else {
                if (DEBUG) log('[DEBUG] ' + 'VALIDIERUNG ' + LPCONF.name + ': Adapter/Datenpunkt [' + lpSensorStatePath.split('.')[0] + '] ist korrekt konfiguriert.');
            }
        }

        /////////////////////////////////////////////////////
        // 2. Prüfung und Umwandlung LPCONF.target
        /////////////////////////////////////////////////////
        if (typeof LPCONF.target == 'string') {
            if( getObject(LPCONF.target).common['type'] != 'boolean') {
                log('[DEBUG] ' + 'VALIDIERUNG ' + LPCONF.name + ': Einstellung für "target" ist fehlerhaft: Datenpunkt ist nicht vom Typ Boolean (true/false).', 'warn');
                errorCount++;
            } else {
                LPCONF.target = {on:{state:LPCONF.target, cmd:true}, off:{state:LPCONF.target, cmd: false}, checkOnOffStatusState:LPCONF.target};
            }
        } else {
            // We expect an object with at least on.state and on.cmd available
            if( isLikeEmpty(LPCONF.target.on.state) || isLikeEmpty(LPCONF.target.on.cmd) ) {
                log('[DEBUG] ' + 'VALIDIERUNG ' + LPCONF.name + ': Einstellung für "target" ist fehlerhaft - target.on.state und/oder target.on.cmd nicht definiert!', 'warn');
                errorCount++;
            } else {
                // If checkOnOffStatusState is not defined, we ensure that on.state is boolean, so that we can use this state instead.
                if( isLikeEmpty(LPCONF.target.checkOnOffStatusState)) {
                    if ( ! (LPCONF.target.on.cmd == true || LPCONF.target.on.cmd == false) ) {
                        log('[DEBUG] ' + 'VALIDIERUNG ' + LPCONF.name + ': Einstellung für "target" ist fehlerhaft: target.checkOnOffStatusState ist nicht gesetzt, und target.on.cmd ist nicht Boolean (true/false), daher kann nicht geprüft werden ob Gerät an/aus!', 'warn');
                        errorCount++;
                    } else {
                        // checkOnOffStatusState is not defined, but on.state is boolean, so we use this instead.
                        LPCONF.target.checkOnOffStatusState = LPCONF.target.on.state;
                    }
                }
            }
        }




        /////////////////////////////////////////////////////
        // 3. Some more validation
        /////////////////////////////////////////////////////
        const LP_PERIOD_KEYS = (Object.keys(LPCONF).filter(str => str.includes('period_'))); // gibt alle Keys mit 'period_' als Array zurück, also z.B. ['period_1','period_2']
        if (isLikeEmpty(LP_PERIOD_KEYS)) {
            log('Konfiguration von Bewegungsmelder ' + LPCONF.name + 'Es wurden keine Zeiten definiert (period_1, etc.). Bitte Script-Konfiguration überprüfen.', 'warn');
            errorCount++;
        } else {
            for (const LP_PERIOD_KEY of LP_PERIOD_KEYS) {
                let lpSecs = LPCONF[LP_PERIOD_KEY].sec;                    
                if( (isLikeEmpty(lpSecs) || (lpSecs <= 0)) ) {
                    if (DEBUG) log('[DEBUG] VALIDIERUNG ' + LPCONF.name + ': In [' + LP_PERIOD_KEY + '] wurden keine Sekunden zum Ausschalten definiert oder auf 0 gesetzt, daher wird nicht automatisch abgeschaltet.');
                } 
            }
        }

    } //for

    if (errorCount == 0) {
        if (DEBUG) log('[DEBUG] ' + 'VALIDIERUNG *** ENDE: Prüfung der Script-Konfiguration, Ergebnis: keine Fehler ***');
        main();
    } else {
        log('Insgesamt ' + errorCount + ' Fehler in der Script-Konfiguration gefunden. Daher wird abgebrochen und das Script nicht weiter ausgeführt.', 'error');
    }

};



/****************************************************************************
 * Main function
 ****************************************************************************/
function main() {

    if(INFO) log('*** Bewegungsmelder-Script gestartet *** Folgende Bewegungsmelder werden überwacht: ' + G_Sensornames.join(', '));

    for (const LPCONF of MOTION_SENSORS) {

        // Initialize Timers
        G_Timers[LPCONF.name] = new myTimer();
        G_WaitTimers[LPCONF.name] = new myTimer();

        // We are allowing multiple sensors for one area.
        let sensorStateArray = [];
        if (typeof LPCONF.sensorState == 'string') {
            // If we just have one sensor as string
            sensorStateArray.push(LPCONF.sensorState);
        } else {
            sensorStateArray = LPCONF.sensorState;
        }

        for (const lpSensorState of sensorStateArray) {

            on({id: sensorState(lpSensorState, 'stateMotion'), val:true}, function(obj) {

                // Need to have statePath within on() function;
                let lpSensorStatePath = obj.id.substring(0, obj.id.length - (obj.id.match(/([^.]*$)/)[0].length + 1)); // removes the last part like ".motion"


                /////////////////////////////////////////////////////////////////////
                ///////////// Wir haben eine Bewegung //////////////////////////
                /////////////////////////////////////////////////////////////////////
                if (DEBUG) log('[DEBUG] ' + LPCONF.name + ': Bewegungsmelder wurde ausgelöst.');
                let whyNotOnLog = ''; // for final info log
                let doIt = true;  // tells us we we REALLY want to turn device on
                let periodHit = ''; // Which period? Need this several times
                G_Timers[LPCONF.name].stop(); // just in case: stop timer.
                

                // Einschalten Prüfung 1: Wait aktiv?
                if (doIt) {
                    if (G_WaitTimers[LPCONF.name].isRunning()) {
                        if (DEBUG) log('[DEBUG] ' + LPCONF.name + ': Check #1: Wait-Timer ist noch aktiv für ' + Math.round(G_WaitTimers[LPCONF.name].getTimeLeft()/1000) + ' Sekunden, also schalten wir nicht und brechen hier ab.');
                        whyNotOnLog = 'Wait ist noch aktiv für ' + Math.round(G_WaitTimers[LPCONF.name].getTimeLeft()/1000) + ' Sekunden';
                        doIt = false;
                    } else {
                        if (DEBUG) log('[DEBUG] ' + LPCONF.name + ': Check #1: Wait-Timer ist nicht aktiv.');
                    };
                };

                // Einschalten Prüfung 2: Soll lt. definierten Datenpunkt in MOTION_SENSORS, neverState_XXX nicht geschaltet werden.
                if (doIt) {
                    const lpNeverStateKeys = (Object.keys(LPCONF).filter(str => str.includes('neverState_'))); // gibt alle Keys mit 'neverState_' als Array zurück, also z.B. ['neverState_1','neverState_2']. Oder leeres Array [] falls nichts vorhanden
                    if(isLikeEmpty(lpNeverStateKeys)) {
                        if (DEBUG) log('[DEBUG] ' + LPCONF.name + ': Check #2: Keine Datenpunkte definiert, die geprüft werden, ob NICHT geschaltet werden soll.');
                    } else {
                        for (const lpNeverStateKey of lpNeverStateKeys) {
                            let lpStateId = LPCONF[lpNeverStateKey].state;
                            let lpStateVal = LPCONF[lpNeverStateKey].val;
                            let validationPassed = false;

                            // 1. Validierung
                            if( isLikeEmpty(lpStateId) || lpStateVal == undefined ) { // check lpStateVal for undefined only, since it could have like an empty string.
                                if (DEBUG) log('[DEBUG] ' + LPCONF.name + ': Check #2: Keine korrekte Konfiguration in ' + lpNeverStateKey);
                            } else if( ($(lpStateId).length < 1) || (!existsState(lpStateId)) ) { // Workaround due to https://github.com/ioBroker/ioBroker.javascript/issues/478
                                log('Bewegungsmelder ' + LPCONF.name + ': In ' + lpNeverStateKey + ' angegebener Datenpunkt "' + lpStateId + '" wurde nicht gefunden.', 'warn');
                                // Wir machen aber trotzdem weiter, also lassen doIt auf true.
                            } else {
                                validationPassed = true;
                            }

                            // 2. Prüfung Datenpunkt
                            if (validationPassed) {
                                let stateValToCheck = getState(lpStateId).val;
                                if (stateValToCheck == lpStateVal) {
                                    // Treffer -- wir schalten NICHT
                                    if (DEBUG) log('[DEBUG] ' + LPCONF.name + ': Check #2: Datenpunkt-Inhalt zum nicht schalten (' + lpStateId + ') stimmt mit Script-Einstellung überein, Inhalt: [' + lpStateVal + ']. Also NICHT schalten.');
                                    whyNotOnLog = 'Datenpunkt  (' + lpStateId + ') stimmt mit Script-Einstellung überein, Inhalt: [' + lpStateVal + '].';
                                    doIt = false;
                                    break; // Exit loop since we have a hit                                
                                } else {
                                    if (DEBUG) log('[DEBUG] ' + LPCONF.name + ': Check #2: Datenpunkt-Inhalt zum nicht schalten (' + lpStateId + ') stimmt NICHT mit Script-Einstellung überein; Script-Vorgabe: [' + lpStateVal + '], Datenpunkt-Inhalt: [' + stateValToCheck + ']. Also machen wir weiter.');
                                }
                            }
                        }
                    }
                }

                // Einschalten Prüfung 3: Ist aktuelle Zeit im Zeitraum "Nie schalten". Wird nur angewendet, falls neverPeriod_xxx vorhanden.
                if (doIt) {
                    const lpNeverKeys = (Object.keys(LPCONF).filter(str => str.includes('neverPeriod_'))); // gibt alle Keys mit 'neverPeriod_' als Array zurück, also z.B. ['neverPeriod_1','neverPeriod_2']. Oder leeres Array [] falls nichts vorhanden
                    if(isLikeEmpty(lpNeverKeys)) {
                        if (DEBUG) log('[DEBUG] ' + LPCONF.name + ': Check #3: Keine Zeiträume für "Nie schalten" definiert.');
                    } else {
                        for (const lpNeverKey of lpNeverKeys) {
                            // Die Funktion prüft alles für uns.
                            let match = currentTimeMatchesPeriod(LPCONF[lpNeverKey], LPCONF.name + ': Check #3 (' + lpNeverKey + ')');
                            if (match) {
                                // Treffer, also nicht schalten.
                                if (DEBUG) log('[DEBUG] ' + LPCONF.name + ': Check #3: Zeitraum (' + lpNeverKey + ') ist in Bereich "Nie schalten", also schalten wir nicht.');
                                whyNotOnLog = 'Zeitraum  (' + lpNeverKey + ') ist in Bereich "Nie schalten"';
                                doIt = false;
                                break; // Exit loop since we have a hit
                            }
                        }
                    }
                }

                // Einschalten Prüfung 4: Nur zu definierten Zeiten. 
                if (doIt) {
                    const lpPeriodKeys = (Object.keys(LPCONF).filter(str => str.includes('period_'))); // gibt alle Keys mit 'period_' als Array zurück, also z.B. ['period_1','period_2']
                    if (isLikeEmpty(lpPeriodKeys)) {
                        log('Im Script wurden keine Zeiten definiert (period_1, etc.). Bitte Script-Konfiguration überprüfen.', 'error');
                        whyNotOnLog = 'Keine Zeiten im Script (period_xxx) definiert';
                        doIt = false;
                    } else {
                        let isInRange = false;
                        for (const lpPeriodKey of lpPeriodKeys) {
                            // Die Funktion prüft alles für uns.
                            let match = currentTimeMatchesPeriod(LPCONF[lpPeriodKey], LPCONF.name + ': Check #4 (' + lpPeriodKey + ')');
                            if (match) {
                                // Treffer, also schalten.
                                if (DEBUG) log('[DEBUG] ' + LPCONF.name + ': Check #4: Treffer - aktuelle Uhrzeit ist innerhalb Zeitraum (' + lpPeriodKey + ').' );
                                isInRange = true;
                                periodHit = lpPeriodKey; // Gefundene Zeitperiode ('period_') in globale Variable. Brauchen wir für Prüfung Lichtstärke, und auch beim Ausschalten (um die jew. gesetzten Lux zu bekommen)
                                break; // Exit loop since we have a hit                            
                            }
                        }
                        if (!isInRange) {
                            if (DEBUG) log('[DEBUG] ' + LPCONF.name + ': Check #4: Aktuelle Uhrzeit fällt in keine der definierten Zeitperioden.' );
                            whyNotOnLog = 'Aktuelle Uhrzeit fällt in keine der definierten Zeitperioden.';
                            doIt = false;
                        }
                    }
                }

                // Einschalten Prüfung 5: Lichtstärke
                if (doIt) {
                    if (! isLikeEmpty(LPCONF[periodHit].lux )) {
                        if( (LPCONF[periodHit].lux < 10000) && (LPCONF[periodHit].lux > -1))  {
                            if (DEBUG) log('[DEBUG] ' + LPCONF.name + ': Check #5: Prüfung auf Lux ist aktiviert.')
                            // Prüfung: luxAlways
                            let luxAlways = false;
                            if( !isLikeEmpty(LPCONF[periodHit].luxAlways) && LPCONF[periodHit].luxAlways == true ) {
                                luxAlways = true;
                                if (DEBUG) log('[DEBUG] ' + LPCONF.name + ': "luxAlways" ist aktiviert, daher schalten wir immer auch auf Basis der Lux des Bewegungsmelders, auch wenn das Gerät (z.B. Licht) bereits an ist."')
                            }
                            if (getState(LPCONF.target.checkOnOffStatusState).val == true && luxAlways == false) {
                                if (DEBUG) log('[DEBUG] ' + LPCONF.name + ': Check #5: Gerät ist aber bereits an, also wird Prüfung auf Lux jetzt deaktiviert (da durch das Licht die Lux-Prüfung verfälscht wird).')
                            } else {
                                // Prüfung: gemessene Lux kleiner Schwellwert, bis zu dem geschalten werden soll?
                                let luxSensorState = getState(sensorState(lpSensorStatePath, 'stateLux')).val;
                                if (luxSensorState >= LPCONF[periodHit].lux) {
                                    if (DEBUG) log('[DEBUG] ' + LPCONF.name + ': Check #5: Gemessene Lux = ' + luxSensorState + ', >= Schwelle von ' + LPCONF[periodHit].lux + ', daher wird nicht geschaltet.');
                                    whyNotOnLog = 'Gemessene Lux = ' + luxSensorState + ', >= Schwelle von ' + LPCONF[periodHit].lux;
                                    doIt = false;
                                } else {
                                    if (DEBUG) log('[DEBUG] ' + LPCONF.name + ': Check #5: Gemessene Lux = ' + luxSensorState + ', < Schwelle von ' + LPCONF[periodHit].lux + ', daher eingeschaltet.')
                                }
                            }
                        } else {
                            if (DEBUG) log('[DEBUG] ' + LPCONF.name + ': Check #5: Prüfung auf Lux ist deaktiviert.')
                        }
                    } else {
                        if (DEBUG) log('[DEBUG] ' + LPCONF.name + ': Check #5: Prüfung auf Lux ist deaktiviert.')
                    }
                }

                // Einschalten: All checks processed.
                if (DEBUG) log('[DEBUG] ' + LPCONF.name + ': Alle Einschalt-Prüfungen durchgeführt, Ergebnis: ' + ((doIt) ? 'JA - einschalten' : 'NEIN - nicht einschalten'));
                if (doIt) {

                    ////////////////////////////////
                    // Jetzt einschalten
                    ////////////////////////////////

                    // Prüfung ob bereits eingeschaltet.
                    let isOnAlready = false;
                    if (!isLikeEmpty(LPCONF.target.checkOnOffStatusState)) {
                        if (DEBUG) log('[DEBUG] Check #5 - ' + LPCONF.name + ': Datenpunkt für Prüfung, ob Gerät bereits angeschaltet ist, ist vorhanden: ' + LPCONF.target.checkOnOffStatusState)
                        if ( getState(LPCONF.target.checkOnOffStatusState).val ) {
                            // Device is already turned on
                            if (DEBUG) log('[DEBUG] Check #5 - ' + LPCONF.name + ': Gerät ist bereits angeschaltet, also schalten wir nicht noch mal.');
                            isOnAlready = true;
                        } else {
                            if (DEBUG) log('[DEBUG] Check #5 - ' + LPCONF.name + ': Gerät ist nicht eingeschaltet, also schalten wir es ein.')
                        }
                    } else {
                        if (DEBUG) log('[DEBUG] Check #5 - ' + LPCONF.name + ': Kein Datenpunkt für Prüfung, ob Gerät bereits angeschaltet ist, definiert. Also wird auf jeden Fall geschaltet.')
                    }
                    // JETZT SCHALTEN.
                    if(DEBUG && G_WaitTimers[LPCONF.name].isRunning()) log('[DEBUG] ' + LPCONF.name + ': "wait" ist aktiv, läuft noch ' + Math.round(G_WaitTimers[LPCONF.name].getTimeLeft()/1000) + ' Sekunden.');
                    // nur falls: 1.) Nicht bereits an und 2.) Kein wait aktiv                    
                    if(doIt && !isOnAlready && !G_WaitTimers[LPCONF.name].isRunning()) {
                        setState(LPCONF.target.on.state, LPCONF.target.on.cmd);
                        if (INFO) log('Bewegungsmelder ' + LPCONF.name + ': Ausgelöst und alle Kriterien erfüllt, daher wird eingeschaltet.');
                    }

                    //////////////////////////
                    // Falls "wait" aktiviert: Timer prüfen / setzen für nächste Bewegungen
                    //////////////////////////
                    if( (isLikeEmpty(LPCONF[periodHit].sec) || (LPCONF[periodHit].sec == 0)) ) {
                        if (DEBUG) log('[DEBUG] ' + LPCONF.name + ': Wait-Timer wird nicht gesetzt, da keine Ausschaltsekunden definiert.');
                    } else {
                        if ( isLikeEmpty(LPCONF.wait) || LPCONF.wait < LPCONF[periodHit].sec ) {
                            if (DEBUG) log('[DEBUG] ' + LPCONF.name + ': "wait" ist nicht gesetzt oder kleiner als definierte Ausschaltsekunden von ' + LPCONF[periodHit].sec + 's, daher wird "wait" nicht weiter betrachtet.')
                        } else {
                            if ( !G_WaitTimers[LPCONF.name].isRunning() ) {
                                if (DEBUG) log('[DEBUG] ' + LPCONF.name + ': "Wait"-Timer läuft nicht. Also starten wir den Timer: ' + LPCONF.wait + ' Sekunden. Damit wird erst wieder nach dieser Zeit erneut eingeschaltet.');
                                    // Timer-Start
                                    G_WaitTimers[LPCONF.name].start(function() {
                                        G_WaitTimers[LPCONF.name].stop(); // just in case
                                        if (DEBUG) log('[DEBUG] ' + LPCONF.name + ': "wait" von ' + LPCONF.wait + ' Sekunden seit letzter Einschaltung ist abgelaufen, daher wird "wait" wieder deaktiviert.');
                                    }, LPCONF.wait * 1000);
                            } else {
                                if (DEBUG) log('[DEBUG] ' + LPCONF.name + ': "Wait"-Timer ist noch aktiv und läuft noch ' + G_WaitTimers[LPCONF.name].getTimeLeft() + ' Sekunden. ');
                            }
                        }
                    }

                    ////////////////////////////////
                    // Nun der Timer zum Ausschalten
                    ////////////////////////////////
                    // Timer-Prüfung: Falls sec=0 oder sec nicht definiert, dann soll nicht per diesem Script ausgeschaltet werden.
                    if( (isLikeEmpty(LPCONF[periodHit].sec) || (LPCONF[periodHit].sec <= 0)) ) {
                        if (DEBUG) log('[DEBUG] ' + LPCONF.name + ': Keine Sekunden zum Ausschalten definiert oder Ausschalten deaktiviert (lt. [' + periodHit + '] in Konfiguration). Daher setzen wir keinen Timer zum ausschalten.')
                    } else {
                        // Jetzt wird der Timer gesetzt.
                        if (DEBUG) log('[DEBUG] ' + LPCONF.name + ': Wir setzen einen Timer von ' + LPCONF[periodHit].sec + ' Sekunden zum Ausschalten (lt. [' + periodHit + '] in Konfiguration).')
                        
                        G_Timers[LPCONF.name].start(function() {
                            /////////////////////////////////////////
                            // Timer ist abgelaufen (wir sind im Callback von setTimeout())
                            /////////////////////////////////////////
                            G_Timers[LPCONF.name].stop();
                            if (DEBUG) log('[DEBUG] ' + LPCONF.name + ': Timer (' + LPCONF[periodHit].sec + ' Sekunden) ist abgelaufen (lt. [' + periodHit + '] in Konfiguration).');


                            // Jetzt ausschalten
                            let whyNotOffLog = ''; // for final info log
                            let turnOff = true;
                            if (!isLikeEmpty(LPCONF.target.checkOnOffStatusState)) {
                                if (DEBUG) log('[DEBUG] TurnOff Check 1: ' + LPCONF.name + ': Datenpunkt für Prüfung, ob Gerät bereits ausgeschaltet ist, ist vorhanden: ' + LPCONF.target.checkOnOffStatusState)
                                if (! getState(LPCONF.target.checkOnOffStatusState).val ) {
                                    if (DEBUG) log('[DEBUG] TurnOff Check 2: ' + LPCONF.name + ': Gerät ist bereits ausgeschaltet, also machen wir nichts weiter.')
                                    whyNotOffLog = 'Gerät ist bereits ausgeschaltet';
                                    turnOff = false;
                                } else {
                                    if (DEBUG) log('[DEBUG] TurnOff Check 2: ' + LPCONF.name + ': Gerät ist eingeschaltet, also schalten wir aus.')
                                }
                            } else {
                                if (DEBUG) log('[DEBUG] TurnOff Check #2 - ' + LPCONF.name + ': Kein Datenpunkt für Prüfung, ob Gerät bereits ausgeschaltet ist, definiert. Also wird auf jeden Fall ausgeschaltet.')
                            }
                            // Ausschalten: All checks processed.
                            if (DEBUG) log('[DEBUG] ' + LPCONF.name + ': Alle Ausschalt-Prüfungen durchgeführt. Ergebnis (ob ausgeschaltet werden soll): ' + turnOff);
                            if (turnOff) {
                                //////////// FINALLY, WE TURN DEVICE OFF //////////////////
                                if (INFO) log('Bewegungsmelder ' + LPCONF.name + ': Timer (' + LPCONF[periodHit].sec + 's) abgelaufen und alle Kriterien erfüllt, daher wird ausgeschaltet.');
                                setState(LPCONF.target.off.state, LPCONF.target.off.cmd);               
                            } else {
                                if (INFO) log('Bewegungsmelder ' + LPCONF.name + ': Timer (' + LPCONF[periodHit].sec + 's) abgelaufen, aber es wird nicht geschaltet, Grund: ' + whyNotOffLog);
                            }
                        }, (LPCONF[periodHit].sec) * 1000);
                    }
                
                } else {
                    if (INFO) log('Bewegungsmelder ' + LPCONF.name + ': Ausgelöst, aber es wird nicht geschaltet, Grund: ' + whyNotOnLog);
                }

            }); // on() auf stateMotion - true
        } // for loop: sensorStatesArray
    } // for (const LPCONF of MOTION_SENSORS)
}


/**
 * Returns the full state for a given motion sensor state
 * @param {string} sensorState     sensor state, like "mihome.0.devices.sensor_motion_aq2_1234567abcde"
 * @param {string} stateNameToAdd  state name you want to add per ADAPTER_STATES, like "stateLux"
 * @return {string}    The according state name of the adapter, like: mihome.0.devices.sensor_motion_aq2_1234567abcde.lux
 */
function sensorState(sensorState, stateNameToAdd) {
    if (!sensorState.endsWith('.')) sensorState = sensorState + '.'; // add "." at the end, if it is not there
    const adapterName = sensorState.split('.')[0]; // like: mihome, zigbee, etc.
    let result = '';
    let isError = true;
    if (! isLikeEmpty(adapterName) && (ADAPTER_STATES[adapterName] != undefined)) {
        if (stateNameToAdd in ADAPTER_STATES[adapterName]) {
            result = ADAPTER_STATES[adapterName][stateNameToAdd];
            if(! isLikeEmpty(result)) {
                isError = false;
            }
        }
    }
    if(isError) {
        log('Catched Script Error in function sensorState(): Could not get adapter state name "' + stateNameToAdd + '" for [' + sensorState + '].', 'error');
        return 'ERROR';
    } else {
        return sensorState + result;
    }
}

/**
 * Better timer function
 * Features: Find out time remaining, stop timer easily, check status (running yes/no).
 * Autor:               Mic (ioBroker) | Mic-M (github)
 * Version:             0.1 (14 March 2020)
 * Source:              https://stackoverflow.com/questions/3144711/
 * -----------------------------------------------
 * Make a timer:
      let a = new myTimer();
      a.start(function() {
       // Do what ever
      }, 5000);
 * Time remaining:      a.getTimeLeft()
 * Stop (clear) timer:  a.stop()
 * Is timer running:    a.isRunning()
 * -----------------------------------------------
 */
function myTimer() {
    let fcallback;
    let id;
    let started;
    let remaining = 0;
    let running = false;

    this.start = function(callback, delay) {
        fcallback = callback;
        remaining = delay;
        clearTimeout(id);
        id = null;
        running = true;
        started = Date.now();
        id = setTimeout(fcallback, remaining);
    }

    this.pause = function() {
        running = false;
        clearTimeout(id);
        remaining -= Date.now() - started;
    }

    this.stop = function() {
        running = false;
        clearTimeout(id); id = null;
        remaining = 0;
    }

    this.getTimeLeft = function() {
        if (running) {
            this.pause();
            this.start(fcallback, remaining);
            return remaining;
        } else {
            return 0;
        }
    }

    this.isRunning = function() {
        return running;
    }

}


/***************************************************************
 * Checks if provided period as object, like {start:'7:00', end:'23:00', days:'2-4, 6'} is matching with current date/time.
 * start and end: See https://github.com/ioBroker/ioBroker.javascript/blob/master/docs/en/javascript.md#comparetime
 *                Astro is allowed as well, so like start:'sunsetStart' or with an offset like end:{astro: 'sunrise', offset: -30}
 * days:          Monday = 1, Tuesday = 2, ... Sunday = 7. You can separate days with comma, so like '1, 3, 5' for Mon/Wed/Fri,
 *                and you can use period like '2-4' for Tue/Wed/Thu, and you can combine both, so like '2-4, 7' for Tue/Wed/Thu/Sun.
 * @param  {string} info   Any info (like device name), just for the logging.
 * @return {boolean}   true, if current date/time within period, false if not.
 ***************************************************************/
function currentTimeMatchesPeriod(objectPeriod, info) {

    let fStart = objectPeriod.start;
    let fEnd = objectPeriod.end;
    let fDays = objectPeriod.days;

    // Part 1: Check week days
    if (fDays == undefined) {
        if (DEBUG) log('[DEBUG] ' + info + ' - Time Period Check - Keine Wochentage definiert, also gilt jeder Tag.');
        // We continue: If no days defined in object, we consider this as no day limit and allow every day
    } else {
        if (DEBUG) log('[DEBUG] ' + info + ' - Time Period Check - Zu schaltende Wochentage definiert: ' + fDays);
        if (isCurrentDayInRange(fDays)) {
            if (DEBUG) log('[DEBUG] ' + info + ' - Time Period Check - Aktueller Wochentag ist innerhalb definierter Tage.');
            // We continue
        } else {
            if (DEBUG) log('[DEBUG] ' + info + ' - Time Period Check - Aktueller Wochentag ist NICHT innerhalb definierter Tage.');
            // We leave function with false
            return false;
        }
    }

    // Part 2: Check time
    let logPeriod = ((typeof fStart == 'string') ? fStart : JSON.stringify(fStart)) + ' - ' + ((typeof fEnd == 'string') ? fEnd : JSON.stringify(fEnd));
    if (withinRange(fStart, fEnd)) {
        if (DEBUG) log('[DEBUG] ' + info + ' - Time Period Check - Treffer: aktuelle Uhrzeit ist innerhalb Zeitraum (' + logPeriod + ').' );
        return true;
    } else {
        if (DEBUG) log('[DEBUG] ' + info + ' - Time Period Check - Aktuelle Uhrzeit ist NICHT innerhalb Zeitraum (' + logPeriod + ').' );
        return false;
    }


    /*************************************************************************
     * Helper functions following below
     *************************************************************************/

    /**
     * Checks if given string of ranges is matching with current day
     * Numbers 1-7 allowed (stand for weekdays).
     * @param {string} inputRanges   String, like: '5,6', '1-3, 6, 7', '3'
     * @return {boolean} true if matches, false if not
     */
    function isCurrentDayInRange(inputRanges) {
    
        // Get current weekday. Monday = 1, Tuesday = 2, ... Sunday = 7.
        let dateNow = new Date();
        let currWeekday = (dateNow.getDay());
        if (currWeekday == 0) currWeekday = 7; // Sunday should be 7, not 0.

        let resArray = getSingleDaysFromRanges(inputRanges);

        if (resArray.indexOf(currWeekday) != -1) {
            return true;
        } else {
            return false;
        }
    }

    /**
     * Convert given string of ranges to array.
     * Numbers 1-7 allowed (stand for weekdays).
     * @param {string} inputRanges   String, like: '5,6', '1-3, 6, 7', '3'
     * @return {array} Array with each individual number, so '2-4, 7' will return [2,3,4,7]. Returns empty array [] if no matches
     */
    function getSingleDaysFromRanges(inputRanges) {
        let resultArray = [];
        if(!isLikeEmpty(inputRanges)) {
            inputRanges = inputRanges.replace(/[^1-7.,-]+/g,'') // just keep numbers 1-7, ",", ".", "-"
            let inputArray = inputRanges.split(',');
            for (const lpVal of inputArray) {
                let matchResultPeriod = lpVal.match(/(\d)(-)(\d)/); // matches like 2-4
                let matchResultSingle = lpVal.match(/^\d$/g); // matches single number like 2
                if (matchResultPeriod != null) {
                    // Wir haben eine Angabe wie 2-4 - match gibt zurück: ['2-4','2','-','4']
                    for (let i = parseInt(matchResultPeriod[1]); i <= parseInt(matchResultPeriod[3]); i++) {
                        resultArray.push(i);
                    }        
                } else if (matchResultSingle != null) {
                    resultArray.push(parseInt(matchResultSingle[0]));
                }
            }
        }    
        return resultArray;
    }


    /**
     * Checks if time is within range using compareTime()
     */
    function withinRange(startTime, endTime) {
        let result = false;
        if (! isLikeEmpty(startTime) && ! isLikeEmpty(startTime)) {
            if (compareTime(startTime, endTime, 'between')) {
                result = true;
            }
        }
        return result;
    }

}

/**
 * Clear timeouts once script is stopped.
 */
onStop(function (callback) {
    let counter = 0;
    for (const LPCONF of MOTION_SENSORS) {
        if (G_Timers[LPCONF.name].isRunning()) {
            G_Timers[LPCONF.name].stop();
            if (DEBUG) log('[DEBUG] [SCRIPT STOPPED] ' + LPCONF.name + ': Ausschalt-Timer deaktiviert.');
            counter++;
        }
        if (G_WaitTimers[LPCONF.name].isRunning()) {
            G_WaitTimers[LPCONF.name].stop();
            if (DEBUG) log('[DEBUG] [SCRIPT STOPPED] ' + LPCONF.name + ': Wait-Timer deaktiviert.');            
            counter++;
        }
    }
    if (counter > 0) {
        if (DEBUG) log('[DEBUG] [SCRIPT STOPPED] Script sauber gestoppt, es wurden ' + counter + ' Timer deaktiviert.');
    } else {
        if (DEBUG) log('[DEBUG] [SCRIPT STOPPED] Script sauber gestoppt, es gab keine aktivierten Timer.');
    }

    callback();
}, 500);



/**
 * Checks if Array or String is not undefined, null or empty.
 * 08-Sep-2019: added check for [ and ] to also catch arrays with empty strings.
 * @param inputVar - Input Array or String, Number, etc.
 * @return true if it is undefined/null/empty, false if it contains value(s)
 * Array or String containing just whitespaces or >'< or >"< or >[< or >]< is considered empty
 */
function isLikeEmpty(inputVar) {
    if (typeof inputVar !== 'undefined' && inputVar !== null) {
        let strTemp = JSON.stringify(inputVar);
        strTemp = strTemp.replace(/\s+/g, ''); // remove all whitespaces
        strTemp = strTemp.replace(/\"+/g, "");  // remove all >"<
        strTemp = strTemp.replace(/\'+/g, "");  // remove all >'<
        strTemp = strTemp.replace(/\[+/g, "");  // remove all >[<
        strTemp = strTemp.replace(/\]+/g, "");  // remove all >]<
        if (strTemp !== '') {
            return false;
        } else {
            return true;
        }
    } else {
        return true;
    }
}

