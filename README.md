# esphome-shelly-wiz-physical-failsafe

ESPHome packages for **Shelly Gen4** relays (tested on Shelly 2PM Gen4 and 1PM Mini Gen4) that control a group of **WiZ** smart bulbs directly over UDP (port 38899) and add a **physical failsafe**: the Shelly relay powers the bulbs, so if fewer than `quorum` bulbs answer, the wall switch drives the relay (classic dumb-light behaviour) instead of leaving you in the dark.

Built on top of [automatous-io/shelly-gen4-esphome](https://github.com/automatous-io/shelly-gen4-esphome) (pinned to v1.5.2).

## What is inside

- `packages/wiz-physical-failsafe.yaml`: WiZ group control + health check + quorum failsafe. Adds two number fields in the device page: **on brightness** (10-100 %) and **on colour temperature** (2200-6500 K), sent with every "turn on".
- `packages/coil-pwm.yaml` + `components/coil_pwm`: optional relay-coil voltage reduction (full voltage for 200 ms to pull in, then PWM hold at a configurable %, 20 kHz LEDC). **Reduced hold (<100 %) is not yet validated on real hardware**; default is 100 % (disabled).

## Example device

```yaml
substitutions:
  name: soggiorno-sotto
  friendly_name: Soggiorno sotto
  wiz_ips: "192.168.1.141,192.168.1.163,192.168.1.159"
  wiz_input_id: switch_input_1
  wiz_group_name: "Soggiorno sotto"
  coil_relays: "relay_1"
  coil_pins: "5"

packages:
  shelly: github://automatous-io/shelly-gen4-esphome/shelly-2pm-gen4.yaml@v1.5.2
  wiz: github://Gionames/esphome-shelly-wiz-physical-failsafe/packages/wiz-physical-failsafe.yaml@main
  coil: github://Gionames/esphome-shelly-wiz-physical-failsafe/packages/coil-pwm.yaml@main
```

Optional substitutions: `wiz_retry_ms`, `wiz_deadline_ms`, `wiz_confirm_ms`, `health_check_interval`, `poll_interval`, `wiz_sfx`, `wiz_group_name`.

## Keeping it stable

Pin the packages to a tag (`@v1.0.0`) rather than `@main`. Running firmware is never affected by Home Assistant/ESPHome updates; only the next compile is.
