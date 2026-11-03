# esphome-shelly-wiz-physical-failsafe (ramo `modulare-secf`)

Moduli ESPHome per gli **Shelly Gen4** (provati su 1PM Mini Gen4) che comandano direttamente un gruppo di lampade **Wiz** via UDP e aggiungono un **failsafe fisico**: il relè dello Shelly alimenta le lampade e, se rispondono meno lampade del "Quorum Wiz", il pulsante a muro torna a comandare il relè come una luce normale invece di lasciarti al buio.

Questo ramo è la versione in uso. Sta sopra la base [SECF](https://github.com/Gionames/SECF) (tag `gen4-v1.0.11`: relè, ingresso, Relay Mode, pressione lunga) e aggiunge solo le funzioni per le Wiz. Il resto del repository è storico (vedi "Storico").

## Cosa fa

- **Comandi Wiz via UDP** (porta 38899) a tutte le lampade, fino a 8, con rinvio alle lampade che non rispondono e conferma anche dalla sottoscrizione (`syncPilot`, porta 38900). Lo stato reale delle lampade riallinea la luce di Home Assistant.
- **Failsafe**: se rispondono meno lampade del "Quorum Wiz", l'ingresso comanda il relè. Controllo proattivo a luce accesa, uscita automatica quando le lampade rientrano.
- **Luce nativa per Home Assistant e pagina web** ("Luce Wiz"), più uno slider "Temperatura colore" (2200-4000 K, passi di 100) subito sotto l'interruttore della luce.
- **Limiti di luminosità per lampada** ("<nome lampada> - luminosità massima", 0-100): 0 = lampada sempre spenta; 1-9 = ambra fisso RGB 33,11,0; 10-100 = tetto di luminosità. Il campo "Avviso luce" dice quando la luce nativa torna spenta perché le lampade sono a zero.
- **Slider luminosità nella pagina web** da 0 al limite impostato: 0 spegne la luce nativa, 1-9 ambra, 10 e oltre luminosità a 2700 K. Diventa rosso se i valori di accensione superano il limite.
- **Valori di accensione** ("Power-on brightness and temperature values"): ogni riaccensione (pulsante, HA senza valori espliciti) avviene a 2700 K e alla luminosità massima impostata; fanno eccezione i comandi di HA con valori espliciti e il failsafe.
- **Pulsante a muro**: "Comando del pulsante" (*Al rilascio* consigliato, vedi sotto), pressione lunga con opzioni *Nessuna azione*, *Evento a Home Assistant*, *Valori alternativi* e *Dimmer* continuo (arancio scuro al minimo, curva percettiva, parametri regolabili a runtime).
- **Timer** (auto-off/auto-on), **riduzione tensione bobina relè** (PWM), antenna **Wizmote ESP-NOW**, **proxy BLE passivo**, impostazioni Wi-Fi, AP di recupero e diagnostica.
- **Pagina web ordinata a capitoli** e sezione "Versions" con la versione di ogni modulo.

## Moduli

| File | Versione | Ruolo |
|---|---|---|
| `packages/wiz-core.yaml` | 5.7.0 | comandi Wiz, quorum, failsafe, luce nativa, limiti, valori di accensione (obbligatorio) |
| `packages/input.yaml` | 5.2.0 | aggancia l'ingresso della base alle Wiz: azione, pressione lunga, dimmer (obbligatorio) |
| `packages/timer.yaml` | 4.0.1 | auto-off / auto-on (obbligatorio per ora) |
| `packages/versions.yaml` | 1.0.0 | gruppo "Versions" della pagina web (in ogni YAML) |
| `packages/coil-pwm.yaml` + `components/coil_pwm` | 1.0.1 | riduzione tensione bobina (opzionale) |
| `packages/wizmote-espnow-native.yaml` | 1.0.0 | antenna Wizmote ESP-NOW (opzionale) |
| `packages/ble-passive.yaml` | 1.0.0 | proxy BLE passivo (opzionale) |
| `packages/wifi-settings.yaml` | 1.4.3 | impostazioni e watchdog Wi-Fi (opzionale) |
| `packages/wiz-diagnostics.yaml`, `packages/recovery-ap.yaml` | - | diagnostica, AP di recupero (opzionali) |
| `web/collapse.js` | - | capitoli, slider in percentuale e segnalazione in rosso della pagina web |

## Esempio di dispositivo (Shelly 1PM Mini Gen4)

Il YAML del dispositivo ha un blocco di identità in cima e poi gli stessi `packages` per tutti i Mini. I valori qui sono esempi.

```yaml
substitutions:
  name: soggiorno-sotto-1pmminig4
  friendly_name: Soggiorno-sotto-1pmminig4
  ip: "192.168.1.100"
  wiz_ips: "192.168.1.201,192.168.1.202"   # max 8, separati da virgola
  wiz_label_1: "1 soggiorno (192.168.1.201)"
  wiz_label_2: "2 soggiorno (192.168.1.202)"
  wiz_group_name: "Luce"
  line_frequency: "50Hz"
  relay_restore: "RESTORE_DEFAULT_ON"
  coil_relays: "relay_1"
  coil_pins: "10"                          # bobina del relè (Mini: 10)

packages:
  base:
    url: https://github.com/Gionames/SECF
    ref: gen4-v1.0.11
    files: [shelly-gen4/configs/shelly-1pm-mini-gen4.yaml]
  wiz:
    url: https://github.com/Gionames/esphome-shelly-wiz-physical-failsafe
    ref: modulare-secf
    refresh: always
    files:
      - packages/versions.yaml
      - packages/wiz-core.yaml
      - packages/input.yaml
      - packages/timer.yaml
      - packages/coil-pwm.yaml

esphome:
  name: ${name}
wifi:
  use_address: ${ip}
web_server:
  js_url: https://cdn.jsdelivr.net/gh/Gionames/esphome-shelly-wiz-physical-failsafe@<commit>/web/collapse.js
```

Ordine: i moduli vanno **dopo** la base. Aggiungi `api`, `wifi` e le altre sezioni come nei tuoi YAML. Gli altri nomi di lampada (`wiz_label_3`...) sono opzionali.

## Dopo una modifica: basta riflashare gli stessi YAML?

- **Modifica ai moduli `packages/*.yaml`**: basta ricompilare e installare gli stessi YAML (il Builder riscarica il ramo, `refresh: always`). Non serve cambiarli.
- **Modifica a `web/collapse.js`**: l'indirizzo in `js_url` punta a un commit preciso (jsDelivr tiene in cache i rami). Serve aggiornare `<commit>` in ogni YAML e reinstallare, perché `js_url` fa parte del firmware.

## Comando del pulsante

Con **Alla pressione** il pulsante spegne subito la luce: la pressione lunga parte quindi da luce spenta e il dimmer riparte dal minimo e sale, quindi non si può dimmerare verso il basso. Con **Al rilascio** (consigliato) il dimmer parte dalla luminosità attuale. È un campo a runtime: si cambia dalla pagina web o da HA, senza riflashare.

## Stato

Software sperimentale: provato su alcuni Mini (1PM Mini Gen4), non su tutti i modelli. Gli zip di conversione e le release della base sono nel repository SECF e non sono verificati su tutto l'hardware: prova prima su un dispositivo non critico. Il failsafe e le sue frequenze di attivazione sono ancora oggetto di osservazione.

Nota di cablaggio non ufficiale: l'ingresso SW di uno Shelly Gen4 è sembrato funzionare anche con il pulsante verso il **neutro**. Non è documentato da Shelly e deriva solo da prove brevi e informali; falla controllare da un elettricista.

## Stabilità

Fissa sempre la base a un tag (`gen4-v1.0.11`), non a `main`. Il firmware già installato non cambia con gli aggiornamenti di Home Assistant/ESPHome: contano solo alla compilazione successiva.

## Storico

I rami precedenti (`main` con il monolite `wiz-physical-failsafe.yaml` v3, `modularizzazione`, `modularizzazione-per-sperimentazione`, `sperimentale`) sono storici e non più mantenuti.

## Origine e licenza

Lavoro derivato da [automatous-io/shelly-gen4-esphome](https://github.com/automatous-io/shelly-gen4-esphome) v1.5.2, licenza Apache 2.0 (vedi [SECF](https://github.com/Gionames/SECF)).
