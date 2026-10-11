#include "coil_pwm.h"

#include "esphome/core/hal.h"
#include "esphome/core/log.h"

#include <cmath>

namespace esphome {
namespace coil_pwm {

static const char *const TAG = "coil_pwm";
static const uint32_t FULL_DUTY = 1024;  // 10 bit resolution
static const uint32_t KICK_MS = 200;     // full current right after every change of the relay state
static const uint32_t LOOP_MS = 25;

void CoilPwm::dump_config() {
  ESP_LOGCONFIG(TAG, "Coil PWM (hold current reduction):");
  for (size_t i = 0; i < this->pins_.size(); i++) {
    ESP_LOGCONFIG(TAG, "  relay %u: GPIO%u, LEDC channel %u", (unsigned) (i + 1), (unsigned) this->pins_[i],
                  (unsigned) (this->first_channel_ + i));
  }
}

void CoilPwm::loop() {
  const uint32_t now = millis();
  if ((uint32_t) (now - this->last_ms_) < LOOP_MS)
    return;
  this->last_ms_ = now;
  if (this->coils_.size() != this->relays_.size())
    this->coils_.resize(this->relays_.size());

  float pct = this->hold_ != nullptr ? this->hold_->state : 100.0f;
  if (std::isnan(pct) || pct < 30)
    pct = 100;

  if (!this->timer_ok_) {
    if (pct >= 100)
      return;  // original behaviour: LEDC is never touched
    ledc_timer_config_t timer = {};
    timer.speed_mode = LEDC_LOW_SPEED_MODE;
    timer.duty_resolution = LEDC_TIMER_10_BIT;
    timer.timer_num = LEDC_TIMER_3;
    timer.freq_hz = 20000;
    timer.clk_cfg = LEDC_AUTO_CLK;
    this->timer_ok_ = (ledc_timer_config(&timer) == ESP_OK);
    if (!this->timer_ok_) {
      ESP_LOGW(TAG, "LEDC timer not configured");
      return;
    }
  }

  for (size_t i = 0; i < this->relays_.size(); i++) {
    Coil &coil = this->coils_[i];
    const bool on = this->relays_[i]->state;
    if (on != coil.prev)
      coil.on_ms = now;
    coil.prev = on;
    const ledc_channel_t channel = (ledc_channel_t) (this->first_channel_ + i);

    if (!coil.attached) {
      if (!on || pct >= 100)
        continue;
      ledc_channel_config_t cfg = {};
      cfg.gpio_num = this->pins_[i];
      cfg.speed_mode = LEDC_LOW_SPEED_MODE;
      cfg.channel = channel;
      cfg.timer_sel = LEDC_TIMER_3;
      cfg.duty = FULL_DUTY;
      cfg.hpoint = 0;
      if (ledc_channel_config(&cfg) != ESP_OK) {
        ESP_LOGW(TAG, "LEDC channel %u not configured", (unsigned) (i + 1));
        continue;
      }
      coil.attached = true;
      ESP_LOGI(TAG, "relay %u: coil under PWM", (unsigned) (i + 1));
    }

    uint32_t duty = 0;
    if (on)
      duty = (now - coil.on_ms < KICK_MS || pct >= 100) ? FULL_DUTY : (uint32_t) (FULL_DUTY * pct / 100.0f);
    if (ledc_get_duty(LEDC_LOW_SPEED_MODE, channel) != duty) {
      ledc_set_duty(LEDC_LOW_SPEED_MODE, channel, duty);
      ledc_update_duty(LEDC_LOW_SPEED_MODE, channel);
    }
  }
}

}  // namespace coil_pwm
}  // namespace esphome
