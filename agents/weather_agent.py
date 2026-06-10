"""Weather Agent: Fetches live weather data from Open-Meteo API (free, no API key required).

Covers major Australian cities and returns temperature, humidity, wind speed,
cloud cover, and solar radiation — all of which correlate strongly with energy demand.
"""

import logging
import time
from datetime import datetime, timedelta
from typing import Dict, List, Optional
import requests

logger = logging.getLogger("WeatherAgent")


# ── Australian cities with their coordinates ─────────────────────────────────
AUSTRALIAN_CITIES = {
    "sydney":    {"lat": -33.8688, "lon": 151.2093, "name": "Sydney"},
    "melbourne": {"lat": -37.8136, "lon": 144.9631, "name": "Melbourne"},
    "brisbane":  {"lat": -27.4698, "lon": 153.0251, "name": "Brisbane"},
    "adelaide":  {"lat": -34.9285, "lon": 138.6007, "name": "Adelaide"},
    "perth":     {"lat": -31.9505, "lon": 115.8605, "name": "Perth"},
}

DEFAULT_CITY = "sydney"

# Open-Meteo base URL (no API key required)
OPEN_METEO_BASE = "https://api.open-meteo.com/v1/forecast"

# Cache TTL in seconds (avoid hammering the free API)
CACHE_TTL = 600  # 10 minutes


class WeatherAgent:
    """Fetches and caches live weather data for Australian cities."""

    def __init__(self, default_city: str = DEFAULT_CITY):
        self.default_city = default_city.lower()
        self._cache: Dict[str, Dict] = {}          # city → {data, expires_at}
        self._forecast_cache: Dict[str, Dict] = {} # city → {data, expires_at}

    # ── Internal helpers ──────────────────────────────────────────────────────

    def _is_cache_valid(self, cache: Dict, city: str) -> bool:
        entry = cache.get(city)
        if not entry:
            return False
        return time.time() < entry["expires_at"]

    def _build_condition(self, code: int) -> str:
        """Map WMO weather code → human-readable condition."""
        mapping = {
            0: "Clear Sky", 1: "Mainly Clear", 2: "Partly Cloudy", 3: "Overcast",
            45: "Foggy", 48: "Freezing Fog",
            51: "Light Drizzle", 53: "Drizzle", 55: "Heavy Drizzle",
            61: "Light Rain", 63: "Rain", 65: "Heavy Rain",
            71: "Light Snow", 73: "Snow", 75: "Heavy Snow",
            80: "Rain Showers", 81: "Rain Showers", 82: "Heavy Rain Showers",
            95: "Thunderstorm", 96: "Thunderstorm with Hail", 99: "Thunderstorm",
        }
        return mapping.get(code, f"Code {code}")

    def _energy_impact(self, temp: float, humidity: float, cloud: float) -> str:
        """Return a plain-English energy demand impact assessment."""
        if temp >= 35:
            return "🔴 Very High — Extreme heat driving heavy AC load"
        elif temp >= 28:
            return "🟠 High — Warm conditions increasing cooling demand"
        elif temp <= 5:
            return "🟠 High — Cold conditions increasing heating demand"
        elif temp <= 12:
            return "🟡 Moderate — Mild heating demand expected"
        elif cloud > 70:
            return "🟡 Moderate — Overcast; reduced solar offset on grid"
        else:
            return "🟢 Normal — Mild conditions, baseline demand expected"

    # ── Public API ────────────────────────────────────────────────────────────

    def get_current_weather(self, city: str = None) -> Dict:
        """
        Fetch current weather conditions for a given Australian city.
        Returns temperature, humidity, wind speed, cloud cover, solar radiation,
        WMO weather code, and an energy-demand impact label.
        Falls back to safe mock data if the API is unreachable.
        """
        city = (city or self.default_city).lower()
        if city not in AUSTRALIAN_CITIES:
            city = DEFAULT_CITY

        if self._is_cache_valid(self._cache, city):
            return self._cache[city]["data"]

        coords = AUSTRALIAN_CITIES[city]

        params = {
            "latitude":  coords["lat"],
            "longitude": coords["lon"],
            "current": ",".join([
                "temperature_2m",
                "relative_humidity_2m",
                "wind_speed_10m",
                "cloud_cover",
                "weather_code",
                "apparent_temperature",
                "precipitation",
            ]),
            "timezone": "Australia/Sydney",
        }

        try:
            resp = requests.get(OPEN_METEO_BASE, params=params, timeout=8)
            resp.raise_for_status()
            raw = resp.json()["current"]

            code = int(raw.get("weather_code", 0))
            temp = float(raw.get("temperature_2m", 20.0))
            humidity = float(raw.get("relative_humidity_2m", 60.0))
            wind = float(raw.get("wind_speed_10m", 10.0))
            cloud = float(raw.get("cloud_cover", 30.0))
            apparent = float(raw.get("apparent_temperature", temp))
            precip = float(raw.get("precipitation", 0.0))

            data = {
                "city": coords["name"],
                "city_key": city,
                "temperature": round(temp, 1),
                "apparent_temperature": round(apparent, 1),
                "humidity": round(humidity, 1),
                "wind_speed": round(wind, 1),
                "cloud_cover": round(cloud, 1),
                "precipitation": round(precip, 2),
                "weather_code": code,
                "condition": self._build_condition(code),
                "energy_impact": self._energy_impact(temp, humidity, cloud),
                "latitude": coords["lat"],
                "longitude": coords["lon"],
                "source": "Open-Meteo",
                "timestamp": datetime.now().isoformat(),
                "cached": False,
            }

        except Exception as exc:
            logger.warning(f"WeatherAgent: Open-Meteo unreachable ({exc}), using mock data")
            data = self._mock_current(coords["name"], city)

        # Cache result
        self._cache[city] = {"data": data, "expires_at": time.time() + CACHE_TTL}
        return data

    def get_weather_forecast(self, city: str = None, hours: int = 72) -> Dict:
        """
        Fetch hourly weather forecast for the next `hours` hours.
        Returns temperature, humidity, cloud cover per hour, plus a summary.
        """
        city = (city or self.default_city).lower()
        if city not in AUSTRALIAN_CITIES:
            city = DEFAULT_CITY

        cache_key = f"{city}_{hours}"
        if self._is_cache_valid(self._forecast_cache, cache_key):
            return self._forecast_cache[cache_key]["data"]

        coords = AUSTRALIAN_CITIES[city]

        params = {
            "latitude":  coords["lat"],
            "longitude": coords["lon"],
            "hourly": ",".join([
                "temperature_2m",
                "relative_humidity_2m",
                "wind_speed_10m",
                "cloud_cover",
                "precipitation_probability",
                "weather_code",
            ]),
            "forecast_days": min((hours // 24) + 1, 7),
            "timezone": "Australia/Sydney",
        }

        try:
            resp = requests.get(OPEN_METEO_BASE, params=params, timeout=8)
            resp.raise_for_status()
            raw = resp.json()["hourly"]

            times = raw.get("time", [])[:hours]
            temperatures = [round(float(v), 1) for v in raw.get("temperature_2m", [])[:hours]]
            humidities    = [round(float(v), 1) for v in raw.get("relative_humidity_2m", [])[:hours]]
            wind_speeds   = [round(float(v), 1) for v in raw.get("wind_speed_10m", [])[:hours]]
            cloud_covers  = [round(float(v), 1) for v in raw.get("cloud_cover", [])[:hours]]
            precip_prob   = [round(float(v), 1) for v in raw.get("precipitation_probability", [])[:hours]]
            codes         = [int(v) for v in raw.get("weather_code", [])[:hours]]

            hourly = []
            for i, t in enumerate(times):
                hourly.append({
                    "time": t,
                    "temperature": temperatures[i] if i < len(temperatures) else 20.0,
                    "humidity":    humidities[i]    if i < len(humidities)    else 60.0,
                    "wind_speed":  wind_speeds[i]   if i < len(wind_speeds)   else 10.0,
                    "cloud_cover": cloud_covers[i]  if i < len(cloud_covers)  else 30.0,
                    "precip_prob": precip_prob[i]   if i < len(precip_prob)   else 0.0,
                    "condition":   self._build_condition(codes[i] if i < len(codes) else 0),
                })

            # Summary stats
            all_temps = temperatures or [20.0]
            data = {
                "city": coords["name"],
                "city_key": city,
                "hours": hours,
                "hourly": hourly,
                "summary": {
                    "avg_temp":   round(sum(all_temps) / len(all_temps), 1),
                    "max_temp":   round(max(all_temps), 1),
                    "min_temp":   round(min(all_temps), 1),
                    "avg_humidity": round(sum(humidities or [60]) / max(len(humidities), 1), 1),
                    "avg_cloud":    round(sum(cloud_covers or [30]) / max(len(cloud_covers), 1), 1),
                },
                "source": "Open-Meteo",
                "timestamp": datetime.now().isoformat(),
            }

        except Exception as exc:
            logger.warning(f"WeatherAgent: forecast fetch failed ({exc}), using mock data")
            data = self._mock_forecast(coords["name"], city, hours)

        self._forecast_cache[cache_key] = {
            "data": data,
            "expires_at": time.time() + CACHE_TTL,
        }
        return data

    def get_all_cities_current(self) -> List[Dict]:
        """Fetch current weather for all Australian cities in one call."""
        results = []
        for city_key in AUSTRALIAN_CITIES:
            try:
                results.append(self.get_current_weather(city_key))
            except Exception as e:
                logger.warning(f"Failed to get weather for {city_key}: {e}")
        return results

    def get_weather_features(self, city: str = None) -> Dict[str, float]:
        """
        Return weather values in a format ready to be injected as ML features.
        These match the 'weather features (if available)' mentioned in the README.
        """
        w = self.get_current_weather(city)
        return {
            "weather_temp":     w["temperature"],
            "weather_humidity": w["humidity"],
            "weather_wind":     w["wind_speed"],
            "weather_cloud":    w["cloud_cover"],
        }

    # ── Mock fallbacks ────────────────────────────────────────────────────────

    def _mock_current(self, city_name: str, city_key: str) -> Dict:
        import math
        hour = datetime.now().hour
        # Simulate a realistic daily temperature cycle
        temp = 22.0 + 8.0 * math.sin(math.pi * (hour - 6) / 12)
        return {
            "city": city_name, "city_key": city_key,
            "temperature": round(temp, 1), "apparent_temperature": round(temp - 2, 1),
            "humidity": 62.0, "wind_speed": 14.0, "cloud_cover": 25.0,
            "precipitation": 0.0, "weather_code": 1, "condition": "Mainly Clear",
            "energy_impact": self._energy_impact(temp, 62.0, 25.0),
            "latitude": AUSTRALIAN_CITIES.get(city_key, {}).get("lat", -33.87),
            "longitude": AUSTRALIAN_CITIES.get(city_key, {}).get("lon", 151.21),
            "source": "Mock (API unavailable)", "timestamp": datetime.now().isoformat(),
            "cached": False,
        }

    def _mock_forecast(self, city_name: str, city_key: str, hours: int) -> Dict:
        import math
        hourly = []
        base = datetime.now().replace(minute=0, second=0, microsecond=0)
        temps = []
        for i in range(hours):
            t = base + timedelta(hours=i)
            temp = 22.0 + 8.0 * math.sin(math.pi * (t.hour - 6) / 12)
            temps.append(round(temp, 1))
            hourly.append({
                "time": t.isoformat(), "temperature": round(temp, 1),
                "humidity": 62.0, "wind_speed": 14.0, "cloud_cover": 25.0,
                "precip_prob": 5.0, "condition": "Mainly Clear",
            })
        return {
            "city": city_name, "city_key": city_key, "hours": hours, "hourly": hourly,
            "summary": {
                "avg_temp": round(sum(temps) / len(temps), 1),
                "max_temp": max(temps), "min_temp": min(temps),
                "avg_humidity": 62.0, "avg_cloud": 25.0,
            },
            "source": "Mock (API unavailable)", "timestamp": datetime.now().isoformat(),
        }
