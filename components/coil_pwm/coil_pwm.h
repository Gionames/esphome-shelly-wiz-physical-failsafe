#pragma once

#include "esphome/core/component.h"
#include "esphome/components/number/number.h"
#include "esphome/components/switch/switch.h"

#include <driver/ledc.h>
#include <vector>

namespace esphome {
namespace coil_pwm {

// Holds relay coils with reduced PWM current after the relay has closed.
// hold_percent (30..100): 100 = original behaviour, the pin is never handed to LEDC.
class CoilPwm : public Component {
 public:
  void add_relay(switch_::Switch *relay) { this->relays_.push_back(relay); }
  void add_pin(uint8_t pin) { this->pins_.push_back(pin); }
  void set_hold(number::Number *hold) { this->hold_ = hold; }
  void set_first_channel(uint8_t channel) { this->first_channel_ = channel; }

  void dump_config() override;
  void loop() override;
  float get_setup_priority() const override { return setup_priority::LATE; }

 protected:
  struct Coil {
    bool attached{false};
    bool prev{false};
    uint32_t on_ms{0};
  };

  std::vector<switch_::Switch *> relays_;
  std::vector<uint8_t> pins_;
  std::vector<Coil> coils_;
  number::Number *hold_{nullptr};
  uint8_t first_channel_{4};
  bool timer_ok_{false};
  uint32_t last_ms_{0};
};

}  // namespace coil_pwm
}  // namespace esphome
