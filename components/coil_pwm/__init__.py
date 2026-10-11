import esphome.codegen as cg
import esphome.config_validation as cv
from esphome.components import number, switch
from esphome.components.esp32 import include_builtin_idf_component
from esphome.const import CONF_ID

CODEOWNERS = ["@Gionames"]
DEPENDENCIES = ["esp32"]

CONF_RELAYS = "relays"
CONF_PINS = "pins"
CONF_HOLD_PERCENT = "hold_percent"
CONF_FIRST_CHANNEL = "first_channel"

coil_pwm_ns = cg.esphome_ns.namespace("coil_pwm")
CoilPwm = coil_pwm_ns.class_("CoilPwm", cg.Component)


def _csv(value):
    if isinstance(value, str):
        return [s.strip() for s in value.split(",") if s.strip()]
    return value


def _same_length(config):
    if len(config[CONF_RELAYS]) != len(config[CONF_PINS]):
        raise cv.Invalid("relays and pins must have the same number of entries")
    return config


CONFIG_SCHEMA = cv.All(
    cv.Schema(
        {
            cv.GenerateID(): cv.declare_id(CoilPwm),
            cv.Required(CONF_RELAYS): cv.All(_csv, cv.ensure_list(cv.use_id(switch.Switch))),
            cv.Required(CONF_PINS): cv.All(_csv, cv.ensure_list(cv.int_range(min=0, max=48))),
            cv.Required(CONF_HOLD_PERCENT): cv.use_id(number.Number),
            cv.Optional(CONF_FIRST_CHANNEL, default=4): cv.int_range(min=0, max=5),
        }
    ).extend(cv.COMPONENT_SCHEMA),
    _same_length,
)


async def to_code(config):
    # The LEDC driver is excluded from the build by default in recent ESPHome versions.
    include_builtin_idf_component("esp_driver_ledc")
    var = cg.new_Pvariable(config[CONF_ID])
    await cg.register_component(var, config)
    for relay in config[CONF_RELAYS]:
        cg.add(var.add_relay(await cg.get_variable(relay)))
    for pin in config[CONF_PINS]:
        cg.add(var.add_pin(pin))
    cg.add(var.set_hold(await cg.get_variable(config[CONF_HOLD_PERCENT])))
    cg.add(var.set_first_channel(config[CONF_FIRST_CHANNEL]))
