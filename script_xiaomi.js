/*******************************************************************************
 * Script: Schaltung Lichter/Geräte mittels Xiaomi-Aqara-Bewegungsmelder
 * ----------------------------------------------------
 * In das Script lassen sich beliebig viele Xiaomi Aqara Bewegungsmelder einbinden.
 * Bei Bewegung wird dann ein pro Bewegungsmelder definierter Datenpunkt (Licht, 
 * Gerät, etc.) auf "true" geschaltet.
 * Optional wird nur geschaltet, falls Lichtstärke in Lux unter dem eingestellten
 * Schwellwert liegt.
 * Ebenso können 2 Zeiträume vorgegeben werden. Nur in diesen Zeiträumen wird dann
 * geschaltet.
 * Script wurde nicht getestet mit anderen Bewegungsmeldern!
 * ----------------------------------------------------
 * Autor: ioBroker-Forum-Name: Mic / Github-Name: Mic-M
 * Source: https://github.com/Mic-M/iobroker.xiaomi-aquara-motion-control
 * Support: https://forum.iobroker.net/topic/22034/
 * ----------------------------------------------------
 * Change Log:
 *  0.4 Mic - Allow using Zigbee adapter and others as well.
 *  0.3 Mic - few code improvements
 *  0.2 Mic - Fix: Compare Time
 *  0.1 Mic - Initial Release
 ******************************************************************************/
 

/*******************************************************************************
 * Konfiguration
 ******************************************************************************/

// Hier die einzelnen Bewegungsmelder konfigurieren und beliebig Zeilen hinzufügen.
// Zeiten: nur in den angegebenen Zeiten wird geschaltet. Falls immer geschaltet
// werden soll, dann jeweils '0:00' und '23:59' eintragen. Falls nur ein Zeitraum
// gewünscht ist, Zeitraum 2 leer lassen.
const MOTIONDEV = [];
//             [0] Name              [1] Zeit 1  [2] Zeit 1 [3] Zeit 2 [4] Zeit 2  [5] Zeit: NIE  [6] Zeit: NIE  [7] Nach wie vielen Minuten ohne   [8] Ab wieviel Lux soll nicht mehr eingeschaltet  [9] Datenpunkt Bewegungsmelder: indicator.motion         [10] Datenpunkt Bewegungsmelder: Lux                         [11] Datenpunkt Gerät Einschalten: State     [12] Einschalten      [13] Datenpunkt Gerät Ausschalten: State  [14] Ausschalten    [15] Gerät-Datenpunkt: Einschaltstatus (boolean)
//                 (beliebig)            von         bis        von         bis        schalten       schalten       Bewegung wieder aus? Falls 0,      werden? Falls 9999, dann wird unababhängig                                                                                                                                                                          Kommando                                                        Kommando
//                                                                                       von            bis          dann wird nicht ausgeschaltet.     von den gemessenen Lux immer eingeschaltet.
MOTIONDEV[0] = [   'Schlafzimmer',      'sunsetStart', '21:30',   '',     '',             '',       '',                           2,                                90,                               'mihome.0.devices.sensor_motion_aq2_xxxxxxxxxxxx.state', 'mihome.0.devices.sensor_motion_aq2_xxxxxxxxxxxx.lux',    'hue.0.Schlafzimmer1.on',                    true,                'hue.0.Schlafzimmer1.on',                false,              'hue.0.Schlafzimmer1.on'];
MOTIONDEV[2] = [   'Küche',             '7:00',     '23:00',    '',    '',           'goldenHourEnd',   'goldenHour',             2,                                1,                                'mihome.0.devices.sensor_motion_aq2_xxxxxxxxxxxx.state', 'mihome.0.devices.sensor_motion_aq2_xxxxxxxxxxxx.lux',    'shelly.0.SHSW-1#xxxxxxxxxxxx#1.Relay0.Switch',     true,                'shelly.0.SHSW-1#xxxxxxxxxxxx#1.Relay0.Switch', false,              'shelly.0.SHSW-1#xxxxxxxxxxxx#1.Relay0.Switch'];
MOTIONDEV[3] = [   'Bad',               '7:00',     '23:00',    '',    '',             'goldenHourEnd', 'goldenHour',             2,                                150,                              'mihome.0.devices.sensor_motion_aq2_xxxxxxxxxxxx.state', 'mihome.0.devices.sensor_motion_aq2_xxxxxxxxxxxx.lux',    'shelly.0.SHSW-1#xxxxxxxxxxxx#1.Relay0.Switch',     true,                'shelly.0.SHSW-1#xxxxxxxxxxxx#1.Relay0.Switch', false,              'shelly.0.SHSW-1#xxxxxxxxxxxx#1.Relay0.Switch'];
MOTIONDEV[4] = [   'Tablet',            '7:00',     '23:00',    '',    '',             '',              '',                       10,                               9999,                             'zigbee.0.xxxxxxxxxxxx.occupancy',                     'zigbee.0.xxxxxxxxxxxx.illuminance',                    'fullybrowser.0.xxxxxxxxxxxx.Commands.screenOn',true,            'fullybrowser.0.xxxxxxxxxxxx.Commands.screenOff', true,           'fullybrowser.0.xxxxxxxxxxxx.Info.isScreenOn'];

// Logeinträge: Infos zeigen (wenn eingeschaltet oder ausgeschaltet wurde)
const INFO = true;

// Logeinträge: Zusätzliche Einträge anzeigen zur Fehlerbehebung. Auf "false" setzen, wenn alles funktioniert.
const DEBUG = false;


/*******************************************************************************
 * Ab hier nichts mehr ändern / Stop editing here!
 ******************************************************************************/

main();
function main() {
    for (let i = 0; i < MOTIONDEV.length; i++) {
        let timer = null;
        on({id: MOTIONDEV[i][9], change: 'ne'}, function(obj) {
            // Falls Timer läuft: auf null setzen.
            if (timer) {
                clearTimeout(timer);
                timer = null;
            }
            if(obj.state.val) {
                if (DEBUG) log('[DEBUG] ' + MOTIONDEV[i][0] + ': Bewegungsmelder-State geändert auf Bewegung = ja');
                // Es gab Bewegung, also prüfen, ob Licht eingeschaltet werden soll...

                // Prüfung 1: Zeitraum in Bereich "Nie schalten" 
                let doIt = true;
                if (isLikeEmpty(MOTIONDEV[i][5]) || isLikeEmpty(MOTIONDEV[i][6])) {
                    // doIt = true;
                } else {
                    if (compareTime(MOTIONDEV[i][5], MOTIONDEV[i][6], 'between')) doIt = false;
                }

                // Prüfung 2: Nur zu definierten Zeiten. 
                //            Falls Zeitraum 2 leer, dann diesen ignorieren.
                let secondComparison = false;
                if (isLikeEmpty(MOTIONDEV[i][3]) || isLikeEmpty(MOTIONDEV[i][4])) {
                    // secondComparison = false;
                } else {
                    if (compareTime(MOTIONDEV[i][3], MOTIONDEV[i][4], 'between')) secondComparison = true;
                }

                // Here we go
                if (doIt && ( compareTime(MOTIONDEV[i][1], MOTIONDEV[i][2], 'between') || secondComparison ) ) {
                    if (DEBUG) log('[DEBUG] ' + MOTIONDEV[i][0] + ': compareTime() ist true.')
                    // Prüfung 3: Soll auch Lichtstärke geprüft werden
                    let LuxIsGiven = true; // Default auf true, wird false gesetzt, falls nicht gegeben.
                    if(MOTIONDEV[i][8] < 9999 ) {
                        if (DEBUG) log('[DEBUG] ' + MOTIONDEV[i][0] + ': Prüfung auf Lux ist aktiviert.')
                        // Prüfung 4: gemessene Lux kleiner Schwellwert, bis zu dem geschalten werden soll?
                        let luxActual = getState(MOTIONDEV[i][10]).val;
                        if (luxActual >= MOTIONDEV[i][8]) {
                            if (DEBUG) log('[DEBUG] ' + MOTIONDEV[i][0] + ': Gemessene Lux = ' + luxActual + ', >= Schwelle von ' + MOTIONDEV[i][8] + ', daher wird nicht geschaltet.')
                            LuxIsGiven = false;
                        } else {
                            if (DEBUG) log('[DEBUG] ' + MOTIONDEV[i][0] + ': Gemessene Lux = ' + luxActual + ', < Schwelle von ' + MOTIONDEV[i][8] + ', daher eingeschaltet.')
                        }
                    }
                    // Wir schalten ein, wenn Gerät/Licht derzeit aus ist und Lux passt
                    let isDeviceOn = getState(MOTIONDEV[i][15]).val;
                    if ( (!isDeviceOn) && (LuxIsGiven) ) {
                        setState(MOTIONDEV[i][11], MOTIONDEV[i][12]); // Licht/Gerät wird eingeschaltet.
                        if(INFO) log(MOTIONDEV[i][0] + ': Bewegungsmelder ausgelöst, daher eingeschaltet.')
                    }
                }
            } else {
                if (DEBUG) log('[DEBUG] ' + MOTIONDEV[i][0] + ': Bewegungsmelder-State geändert auf Bewegung = nein');
                
                // Ausschalten falls gewünscht (falls 0, dann soll nicht per diesem Script ausgeschaltet werden).
                if (MOTIONDEV[i][7] > 0 ) {
                    // wenn erstmals keine Bewegung wird Timer gestartet
                    timer = setTimeout(function() {
                        timer = null;
                        // Ausschalten, falls Gerät an ist.
                        let isDeviceOn = getState(MOTIONDEV[i][15]).val;
                        if (isDeviceOn) {
                            setState(MOTIONDEV[i][13], MOTIONDEV[i][14]); // Licht/Gerät ausschalten nach Ablauf Timer
                            if(INFO) log(MOTIONDEV[i][0] + ': Seit über ' + MOTIONDEV[i][7] + ' Minuten keine Bewegung mehr, daher ausgeschaltet.');
                        }
                    }, MOTIONDEV[i][7] * 60 * 1000); // Timer setzen auf X Minuten
                }
            }
        });
    }
}


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

