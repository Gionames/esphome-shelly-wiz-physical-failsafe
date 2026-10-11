# esphome-shelly-wiz-physical-failsafe

ESPHome packages for **Shelly Gen4** relays (tested on Shelly 2PM Gen4 and 1PM Mini Gen4) that control a group of **WiZ** smart bulbs directly over UDP (port 38899) and add a **physical failsafe**: the Shelly relay powers the bulbs, so if fewer than "Quorum Wiz" bulbs answer, the wall switch/button drives the relay (classic dumb-light behaviour) instead of leaving you in the dark.

Built on top of [automatous-io/shelly-gen4-esphome](https://github.com/automatous-io/shelly-gen4-esphome) (pinned to v1.5.2).

## How it works

- Commands (`setPilot` on/off) are sent to every bulb; bulbs that do not answer with `success` are retried every `wiz_retry_ms` until `wiz_deadline_ms`.
- The Shelly registers itself with each bulb (WiZ `registration`, UDP 38900) and receives push state updates; a safety poll runs every `poll_interval`.
- If fewer bulbs than the adjustable **Quorum Wiz** are reachable, failsafe mode starts: the input drives the relay directly.
- Optional power-cycle (`powercycle_ms`, off by default): opens the relay briefly if no bulb answers although powered.
- Two fields in the device page set the colour used at every "on": **Luminosità accensione** (10-100 %) and **Temperatura colore accensione** (2200-6500 K).
- All entities are the same on every device; only model-specific data lives in the device file.

## Files

- `packages/wiz-physical-failsafe.yaml`: Wiz control + failsafe (v2).
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
  wiz: github://Gionames/esphome-shelly-wiz-physical-failsafe/packages/wiz-physical-failsafe.yaml@v2.0.0
  coil: github://Gionames/esphome-shelly-wiz-physical-failsafe/packages/coil-pwm.yaml@v2.0.0
```

Add your own `esphome:`, `api:` and `wifi:` blocks as usual. The relay id must be `relay_1`.

Optional substitutions: `wiz_retry_ms`, `wiz_deadline_ms`, `wiz_confirm_ms`, `powercycle_ms`, `health_check_interval`, `poll_interval`.

## Input mode

If the light turns on while you hold a push button and off when you release it, set **Modalità Input** to *Pulsante: commuta (Momentary)*. The default *Flip* is meant for toggle switches.

## Keeping it stable

Pin packages to a tag (`@v2.0.0`), never `@main`. Running firmware is not affected by Home Assistant/ESPHome updates; only the next compile is. ESPHome caches GitHub packages for one day, so use a new tag when you change them.

## Versions

- v2.0.0: package based on the Mini logic (adjustable quorum, optional power-cycle); entity names changed for the 2PM.
- v1.1.0: on-colour fields next to each other, readable PWM help.
- v1.0.0: first release.
