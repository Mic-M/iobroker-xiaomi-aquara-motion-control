# iobroker: Bewegungsmelder-Script (für Xiaomi und andere)

## Auszug aus den Features:
1. Beliebig viele Bewegungsmelder einbinden. Pro Bewegungsmelder/Bereich können Geräte/Lichter bei Bewegung eingeschaltet und wieder ausheschaltet werden, sobald x Sekunden keine Bewegung mehr
2. Mehrere Bewegungsmelder pro Raum/Bereich (z.B. Flur) möglich
3. Beliebig viele Zeiträume zum Schalten einstellbar (z.B. nur bestimmte Wochentage, Uhrzeiten, Astro, etc.)
4. Helligkeit (Lux) als Trigger - es wird optional nur eingeschaltet, wenn Helligkeit unter einem vorgegeben Wert ist, damit z.B. bei genügend Helligkeit nicht eingeschaltet wird.
5. Optionale Verzögerung zum wieder einschalten: In manchen Fällen will man ggf. mit dem Bewegungsmelder nur einmalig einschalten. Da kann man für bestimmte Bewegungsmelder einstellen, dass x Sekunden (z.B. 10 Minuten = 600s) nicht mehr neu ausgelöst wird.
6. Prüfung auf Anwesenheit (oder andere Datenpunkte): Wenn im Script konfigurierte Datenpunkte mit einem bestimmten Wert übereinstimmen, wird nicht geschaltet. Hilfreich, um z.B. nicht zu schalten, wenn keiner anwesend ist, oder etwa ein Fenster offen ist, etc.


## 1. Installation

1. [Script-Code](https://raw.githubusercontent.com/Mic-M/iobroker.xiaomi-aquara-motion-control/master/script_xiaomi.js) öffnen.
2. Alles kopieren (Strg + a)
3. Zur ioBroker-Administration wechseln und dort im linken Menü "Skripte" auswählen.
4. Mit dem "+"-Menüpunkt ein neues Script hinzufügen, dann "Javascript" auswählen, und einen Namen vergeben (z.B. "Bewegungsmelder-Script") und speichern.
5. Dieses neue Script öffnen (ist jetzt natürlich noch leer), den zuvor kopierten Code mit Strg+v einfügen und Speichern.

**Wichtig:** Das Script nicht unterhalb des Ordners "Global" erstellen. Das ist unnötig und kostet Performance. Siehe auch: [global-functions](https://github.com/ioBroker/ioBroker.javascript/blob/master/docs/en/javascript.md#)

## 2. Einrichtung

Die Einrichtung ist im Detail im Script beschrieben. Dort sind außerdem mehrere Beispiele enthalten.
Für Fragen hierzu: am besten im ioBroker-Thread stellen: [Vorlage: Bewegungsmelder Xiaomi Aqara: Geräte/Lichter steuern](https://forum.iobroker.net/topic/22034/)

## 3. Weiteres

### Support
Support erhaltet ihr hier im ioBroker Forum: [Vorlage: Bewegungsmelder Xiaomi Aqara: Geräte/Lichter steuern](https://forum.iobroker.net/topic/22034/).

### Changelog

Siehe im Script.

### Lizenz

MIT License

Copyright (c) 2019-2020 Mic-M

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
