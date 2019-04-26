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
 * Version: 0.1
 * Autor: ioBroker-Forum-Name: Mic / Github-Name: Mic-M
 * Source: https://github.com/Mic-M/iobroker.xiaomi-aquara-motion-control
 * Support: https://forum.iobroker.net/topic/22034/
 ******************************************************************************/
 

/*******************************************************************************
 * Konfiguration
 ******************************************************************************/

// Hier die einzelnen Bewegungsmelder konfigurieren und beliebig Zeilen hinzufügen.
// Zeiten: nur in den angegebenen Zeiten wird geschaltet. Falls immer geschaltet
// werden soll, dann jeweils '0:00' und '23:59' eintragen. Falls nur ein Zeitraum
// gewünscht ist, im Zeitraum 2 dieselben Zeiten wie in Zeitraum 1 eintragen.
const MOTIONDEV = [];
//             [0] Name              [1] Zeit 1  [2] Zeit 1 [3] Zeit 2 [4] Zeit 2  [5] Nach wie vielen Minuten ohne   [6] Ab wieviel Lux soll nicht mehr eingeschaltet  [7] Datenpunkt Bewegungsmelder Xiaomi                [8] Datenpunkt schaltendes Gerät/Licht etc.
//                 (beliebig)            von         bis        von         bis        Bewegung wieder aus? Falls 0,      werden? Falls 9999, dann wird unababhängig
//                                                                                     dann wird nicht ausgeschaltet.     von den gemessenen Lux immer eingeschaltet.
MOTIONDEV[0] = [   'Schlafzimmer',      '7:30',     '9:00',    '16:00',   '23:30',               2,                                 100,                                   'mihome.0.devices.sensor_motion_aq2_xxxxxxxxxxxxxx', 'javascript.0.mic.Hue.Schalter-Gruppe.Schlafzimmer'];
MOTIONDEV[1] = [   'Flur',              '0:00',     '23:59',    '0:00',   '23:59',               0,                                 9999,                                 'mihome.0.devices.sensor_motion_aq2_xxxxxxxxxxxxxx', 'shelly.0.SHSW-1#xxxxxx#1.Relay0.Switch']; // Ausschalten: läuft über Shelly-Script nach 2 Minuten
MOTIONDEV[2] = [   'Küche',             '7:30',     '9:00',    '16:00',   '23:30',               2,                                 100,                                 'mihome.0.devices.sensor_motion_aq2_xxxxxxxxxxxxxx', 'shelly.0.SHSW-1#xxxxxx#1.Relay0.Switch'];
MOTIONDEV[3] = [   'Bad',               '7:30',     '9:00',    '16:00',   '23:30',               2,                                 100,                                 'mihome.0.devices.sensor_motion_aq2_xxxxxxxxxxxxxx', 'shelly.0.SHSW-1#xxxxxx#1.Relay0.Switch'];


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
        on({id: MOTIONDEV[i][7] + '.state'/*Is motion*/, change: 'any'}, function(obj) {
            // Falls Timer läuft: auf null setzen.
            if (timer) {
                clearTimeout(timer);
                timer = null;
            }
            if(obj.state.val) {
                if (DEBUG) log('[DEBUG] ' + MOTIONDEV[i][0] + ': Bewegungsmelder-State geändert auf Bewegung = ja');
                // Es gab Bewegung, also prüfen, ob Licht eingeschaltet werden soll...
                // Prüfung 1: Aber zu den definierten Zeiten
                if(compareTime('6:30', '09:00', 'between') || compareTime('16:00', '23:30', 'between') ) {
                    if (DEBUG) log('[DEBUG] ' + MOTIONDEV[i][0] + ': compareTime() ist true.')
                    // Prüfung 2: Soll auch Lichtstärke geprüft werden
                    let LuxIsGiven = true; // Default auf true, wird false gesetzt, falls nicht gegeben.
                    if(MOTIONDEV[i][6] < 9999 ) {
                        if (DEBUG) log('[DEBUG] ' + MOTIONDEV[i][0] + ': Prüfung auf Lux ist aktiviert.')
                        // Prüfung 3: gemessene Lux kleiner Schwellwert, bis zu dem geschalten werden soll?
                        let luxActual = getState(MOTIONDEV[i][7] + '.lux').val;
                        if (luxActual >= MOTIONDEV[i][6]) {
                            if (DEBUG) log('[DEBUG] ' + MOTIONDEV[i][0] + ': Gemessene Lux = ' + luxActual + ', >= Schwelle von ' + MOTIONDEV[i][6] + ', daher wird nicht geschaltet.')
                            LuxIsGiven = false;
                        } else {
                            if (DEBUG) log('[DEBUG] ' + MOTIONDEV[i][0] + ': Gemessene Lux = ' + luxActual + ', < Schwelle von ' + MOTIONDEV[i][6] + ', daher eingeschaltet.')
                        }
                    }
                    // Wir schalten, wenn Gerät/Licht derzeit aus ist und Lux passt
                    let deviceStatus = getState(MOTIONDEV[i][8]).val;
                    if ( (deviceStatus === false) && (LuxIsGiven === true) ) {
                        setState(MOTIONDEV[i][8], true); // Licht/Gerät wird geschaltet.
                        if(INFO) log(MOTIONDEV[i][0] + ': Bewegungsmelder ausgelöst, daher eingeschaltet.')
                    }
                }
            } else {
                if (DEBUG) log('[DEBUG] ' + MOTIONDEV[i][0] + ': Bewegungsmelder-State geändert auf Bewegung = nein');
                // Ausschalten. Aber nur falls gewünscht (falls 0, dann soll nicht per diesem Script ausgeschaltet werden).
                if (MOTIONDEV[i][5] > 0 ) {
                    // wenn erstmals keine Bewegung wird Timer gestartet
                    timer = setTimeout(function() {
                        timer = null;
                        setState(MOTIONDEV[i][8], false); // Licht/Gerät aus nach Ablauf Timer
                        if(INFO) log(MOTIONDEV[i][0] + ': Seit über ' + MOTIONDEV[i][5] + ' Minuten keine Bewegung mehr, daher ausgeschaltet.');
                    }, MOTIONDEV[i][5] * 60 * 1000); // Timer setzen auf X Minuten
                }
            }
        });
    }
}
