# esphome-shelly-wiz-physical-failsafe

ESPHome packages for **Shelly Gen4** relays (tested on Shelly 2PM Gen4 and 1PM Mini Gen4) that control a group of **WiZ** smart bulbs directly over UDP (port 38899) and add a **physical failsafe**: the Shelly relay powers the bulbs, so if fewer than "Quorum Wiz" bulbs answer, the wall switch/button drives the relay (classic dumb-light behaviour) instead of leaving you in the dark.

Built on top of [automatous-io/shelly-gen4-esphome](https://github.com/automatous-io/shelly-gen4-esphome) (pinned to v1.5.2).

## How it works

- Commands (`setPilot` on/off) are sent to every bulb; bulbs that do not answer with `success` are retried every `wiz_retry_ms` until the confirmation time is over. A command also counts as confirmed when the push subscription (`syncPilot`) already shows the wanted state (and, for switch-on, the requested brightness); the log says whether each confirmation came from the direct reply or from the SUBSCRIPTION. If confirmations are missing, a final `getPilot` check runs before failsafe is declared.
- The Shelly registers itself with each bulb (WiZ `registration`, UDP 38900) and receives push state updates; a safety poll runs every `poll_interval`.
- If fewer bulbs than the adjustable **Quorum Wiz** are reachable, failsafe mode starts: the input drives the relay directly.
- Optional power-cycle (`powercycle_ms`, off by default): opens the relay briefly if no bulb answers although powered.
- Four fields (all prefixed `Wiz - `, so they sit together in the device page) set the colour: **Wiz - accensione: luminosità** / **Wiz - accensione: temperatura colore** (used at every normal "on") and **Wiz - pressione lunga: luminosità alternativa** / **Wiz - pressione lunga: temperatura colore alternativa** (used by the long press, see below).
- All entities are the same on every device; only model-specific data lives in the device file.

## Files

- `packages/wiz-physical-failsafe.yaml`: Wiz control + failsafe (v3).
- `packages/coil-pwm.yaml` + `components/coil_pwm`: optional relay-coil voltage reduction (full voltage for 200 ms to pull in, then PWM hold at a configurable %, 20 kHz LEDC). **Reduced hold (<100 %) is not yet validated on real hardware**; default is 100 % (disabled).

## Example device (Shelly 1PM Mini Gen4)

```yaml
substitutions:
  name: my-light
  friendly_name: My light
  line_frequency: "50Hz"
  relay_restore: "RESTORE_DEFAULT_ON"
  relay_linking: "Unlinked"
  wiz_ips: "192.168.1.66"         # comma separated, max 8
  wiz_input_id: switch_input      # 2PM: switch_input_1
  # wiz_group_name: "Luce"        # title of the group in the web page
  coil_relays: "relay_1"
  coil_pins: "10"                 # relay coil GPIO (Mini: 10, 2PM: "5, 3")

packages:
  shelly: github://automatous-io/shelly-gen4-esphome/configs/shelly-1pm-mini-gen4.yaml@v1.5.2
  wiz: github://Gionames/esphome-shelly-wiz-physical-failsafe/packages/wiz-physical-failsafe.yaml@v3.3.0
  coil: github://Gionames/esphome-shelly-wiz-physical-failsafe/packages/coil-pwm.yaml@v2.0.0
```

Add your own `esphome:`, `api:` and `wifi:` blocks as usual. The relay id must be `relay_1`.

The confirmation time is the adjustable entity **Tempo conferma Wiz** (500-4000 ms, default 1400; Home Assistant and web page). The `getPilot` confirmation uses 4/7 of it. Optional substitutions: `wiz_retry_ms`, `powercycle_ms`, `health_check_interval` (default 4s: polling delle Wiz), `poll_interval_ms`, `polling_ms` (`wiz_deadline_ms` and `wiz_confirm_ms` still exist but default to the entity).

## Input mode and push button

Set **Modalità Input** to match the hardware: *Interruttore ... (Flip)* for toggle switches; *Pulsante ... (Momentary)* for push buttons (each press toggles the light). With a push button, Flip would turn the light on at press and off at release. *Activate* never turns off, so it breaks the failsafe; avoid it.

For push buttons (Momentary / Activate) two more fields apply, both changeable at runtime without reflashing:

- **Wiz - comando del pulsante**: *Alla pressione* sends the command to the bulbs immediately (lowest latency; with the light on, a long press turns it off first). *Al rilascio* (default) sends it when the button is released, adding the touch duration but never flashing the light on a long press.
- **Wiz - pressione lunga** (threshold: **Wiz - pressione lunga: durata**, 0.4-3 s): *Nessuna azione*, *Imposta luminosità e colore alternativi alle Wiz* (light on: only changes brightness/colour, does not turn off; light off: turns on already with the alternative values; in failsafe it does nothing) or *Manda l'evento a Home Assistant* (event `pressione_lunga` on the **Ingresso** event entity).

Press, release, click and double-click events were removed on purpose: for a wall switch, latency matters more.

## Wiring note (unofficial)

The SW input of a Shelly Gen4 also appeared to work when the push button connects it to **neutral** instead of live. This is **not documented by Shelly** and is derived only from **brief, informal tests** on a 2PM Gen4 (a few dozen short and long presses, no missed or bouncing presses seen) and from unofficial forum reports. Neutral-side switching reportedly draws more current while pressed: irrelevant for push buttons, not advisable for switches left closed for long periods. Verify on your own hardware and have the wiring checked by a qualified electrician.

## Keeping it stable

Pin packages to a tag (`@v3.3.0`), never `@main`. Running firmware is not affected by Home Assistant/ESPHome updates; only the next compile is. ESPHome caches GitHub packages for one day, so use a new tag when you change them.

## Versions

- v3.4.0: adjustable number of `setPilot` sends per command ("Invii setPilot Wiz", 1-10, default 4 = previous behaviour at 1400 ms), spread evenly within the confirmation time.
- v3.3.0: adjustable confirmation time ("Tempo conferma Wiz"); the push subscription (`syncPilot`) now also counts as command confirmation; logs show direct reply vs SUBSCRIPTION counts. Fixes spurious failsafe with a single slow-to-answer bulb.
- v3.2.0: default push-button command on release; after a power loss the Wiz are always commanded on with the switch-on values.
- v3.1.0: long press toggles between the normal and alternative colour combinations; fields renamed `Wiz - ...` in a fixed order.
- v3.0.0: push-button behaviour: command on press or on release, long press (alternative brightness/colour or event to HA); all new fields prefixed `Wiz - `; removed multi-click switch and press/release/click events. Entities "Accensione software: ..." renamed to "Wiz - ...".
- v2.1.x: on-colour fields (brightness/colour temperature at switch-on), input mode labels explained.
- v2.0.0: package based on the Mini logic (adjustable quorum, optional power-cycle); entity names changed for the 2PM.
- v1.1.0: on-colour fields next to each other, readable PWM help.
- v1.0.0: first release.

## Moduli (ramo `modularizzazione`, v4.1.0 sperimentale)

`packages/wiz-physical-failsafe.yaml` (monolitico, fino a v3.8.0) è stato diviso in moduli con comportamento identico (verificato: la configurazione risolta da `esphome config` coincide). Si includono con `files:`:

```yaml
packages:
  wiz:
    url: https://github.com/Gionames/esphome-shelly-wiz-physical-failsafe
    ref: modularizzazione
    files:
      - packages/wiz-core.yaml            # obbligatorio: comandi Wiz, failsafe (su comando e proattivo), azione wiz_set per HA, entità di stato del failsafe
      - packages/input.yaml               # obbligatorio per ora (da rendere generico)
      - packages/timer.yaml               # obbligatorio per ora (da rendere generico)
      - packages/wiz-diagnostics.yaml     # opzionale
      - packages/wifi-settings.yaml       # opzionale
      - packages/recovery-ap.yaml         # opzionale: AP + captive portal di recupero
      - packages/coil-pwm.yaml            # opzionale
```

Verificate con `esphome config`: core+input+timer; più diagnostics. (Le entità di stato del failsafe sono ora dentro il core.) Input e timer sono ancora referenziati dal codice del core: renderli opzionali richiede degli "hook" (prossimo passo). **Non provato su hardware.**
