#
# Copyright 2026 AUTOMATOUS.IO
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
#
# Modificato nel 2026 da Gionames (lavoro derivato, Apache-2.0): nome e versione del progetto propri, nessuna
# dipendenza da repository di terzi, relè e ingresso unificati in shelly-relay-input.yaml. Vedi NOTICE.
#
import tempfile
from pathlib import Path

import esphome.config_validation as cv
import esphome.final_validate as fv
from esphome.components import esp32
from esphome.const import CONF_JS_INCLUDE

DEPENDENCIES = ["esp32"]
CODEOWNERS = ["@Gionames"]

CONF_LAYOUT = "layout"

# stock tables differ per model; the EM Mini has smaller app and fs slots
LAYOUTS = {
    "standard": "shelly-gen4-stock.csv",
    "em_mini": "shelly-em-mini-gen4-stock.csv",
}

CONFIG_SCHEMA = cv.Schema(
    {cv.Optional(CONF_LAYOUT, default="standard"): cv.one_of(*LAYOUTS, lower=True)}
)


def _final_validate(config):
    # tab icon and firmware version in the title of the device page: web_server serves an empty icon
    # and no version. The script ships inside this component, so it works the same for local builds
    # and for adopted devices built from GitHub; the project version is filled in here.
    full = fv.full_config.get()
    web_server = full.get("web_server")
    if web_server is not None and CONF_JS_INCLUDE not in web_server:
        project = full.get("esphome", {}).get("project", {})
        version = str(project.get("version", "")).replace("\\", "").replace('"', "")
        script = (Path(__file__).parent / "favicon.js").read_text(encoding="utf-8")
        out = Path(tempfile.gettempdir()) / f"gionames-web-{version or 'dev'}.js"
        out.write_text(script.replace("__VERSION__", version), encoding="utf-8")
        web_server[CONF_JS_INCLUDE] = str(out)
    return config


FINAL_VALIDATE_SCHEMA = _final_validate


async def to_code(config):
    # ESPHome skips auto-generated partition table when one is already
    # registered; remote/adopted builds can't reach files outside the cloned
    # repo; the stock table must ship inside this component.
    esp32.add_extra_build_file(
        "partitions.csv",
        Path(__file__).parent / LAYOUTS[config[CONF_LAYOUT]],
    )
