// ============= CONFIGURATION =============
// Set your location coordinates here
const CONFIG = {
  latitude: 55.6761,
  longitude: 12.5289,
  locationName: 'Valby, Copenhagen',
  updateIntervalMinutes: 10
};

// Weather symbol to emoji/description mapping
const weatherSymbols = {
  clearsky_day: { emoji: '☀️', label: 'Clear sky' },
  clearsky_night: { emoji: '🌙', label: 'Clear night' },
  cloudy: { emoji: '☁️', label: 'Cloudy' },
  partlycloudy_day: { emoji: '⛅', label: 'Partly cloudy' },
  partlycloudy_night: { emoji: '🌤️', label: 'Partly cloudy' },
  fair_day: { emoji: '🌤️', label: 'Partly cloudy' },
  fog: { emoji: '🌫️', label: 'Fog' },
  rain: { emoji: '🌧️', label: 'Rain' },
  rainshowers_day: { emoji: '🌧️', label: 'Rain showers' },
  rainshowers_night: { emoji: '🌧️', label: 'Rain showers' },
  sleet: { emoji: '🌨️', label: 'Sleet' },
  sleetshowers_day: { emoji: '🌨️', label: 'Sleet showers' },
  sleetshowers_night: { emoji: '🌨️', label: 'Sleet showers' },
  snow: { emoji: '❄️', label: 'Snow' },
  snowshowers_day: { emoji: '❄️', label: 'Snow showers' },
  snowshowers_night: { emoji: '❄️', label: 'Snow showers' },
  thunderstorm_day: { emoji: '⛈️', label: 'Thunderstorm' },
  thunderstorm_night: { emoji: '⛈️', label: 'Thunderstorm' },
  lightrainshowers_day: { emoji: '🌧️', label: 'Light rain showers' },
  lightrainshowers_night: { emoji: '🌧️', label: 'Light rain showers' },
  lightsleetshowersandthunder_day: { emoji: '⛈️', label: 'Light sleet & thunder' },
  lightsleetshowersandthunder_night: { emoji: '⛈️', label: 'Light sleet & thunder' },
  lightsnowshowersandthunder_day: { emoji: '⛈️', label: 'Light snow & thunder' },
  lightsnowshowersandthunder_night: { emoji: '⛈️', label: 'Light snow & thunder' },
  rainshowersandthunder_day: { emoji: '⛈️', label: 'Rain & thunder' },
  rainshowersandthunder_night: { emoji: '⛈️', label: 'Rain & thunder' },
  sleetshowersandthunder_day: { emoji: '⛈️', label: 'Sleet & thunder' },
  sleetshowersandthunder_night: { emoji: '⛈️', label: 'Sleet & thunder' },
  snowshowersandthunder_day: { emoji: '⛈️', label: 'Snow & thunder' },
  snowshowersandthunder_night: { emoji: '⛈️', label: 'Snow & thunder' }
};

// ============= API FUNCTIONS =============
async function fetchWeatherData(latitude, longitude) {
  try {
      const url = `https://api.met.no/weatherapi/locationforecast/2.0/complete?lat=${latitude}&lon=${longitude}`;
      
      const response = await fetch(url, {
          headers: {
              'User-Agent': 'WeatherInfoScreen/1.0 (institutional-display)'
          }
      });

      if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      return data;
  } catch (error) {
      console.error('Error fetching weather:', error);
      throw error;
  }
}

// ============= DATA PROCESSING =============
function processWeatherData(data) {
  const timeseries = data.properties.timeseries;
  const currentData = timeseries[0];
  const time = new Date(currentData.time);
  
  const details = currentData.data.instant.details;
  const summary = currentData.data.next_1_hours?.summary || {};
  const nextHour = currentData.data.next_1_hours?.details || {};

  return {
      temperature: Math.round(details.air_temperature),
      humidity: Math.round(details.relative_humidity),
      windSpeed: Math.round(details.wind_speed * 3.6), // m/s to km/h
      windMs: details.wind_speed,
      rain: nextHour.precipitation_amount || 0,
      snow: nextHour.snowfall_amount || 0,
      cloud: Math.round(details.cloud_area_fraction || 0),
      isDay: summary.symbol_code?.includes("day"),
      symbolCode: summary.symbol_code || 'cloudy',
      time: time,
      ultravioletIndex: details.ultraviolet_index_clear_sky
  };
}

// ============= TEMPERATURE SCALE POSITIONING =============
function getThermometerPosition(temp) {
  const minTemp = -10;
  const maxTemp = 50;
  const clamped = Math.max(minTemp, Math.min(maxTemp, temp));
  const position = ((clamped - minTemp) / (maxTemp - minTemp)) * 100;
  return position;
}

// ============= CLOTHING RENDER =============
function renderClothingList(clothing) {
  const items = [];

  if (clothing.fullbody) items.push(clothing.fullbody);
  items.push(...clothing.headwear);
  items.push(...clothing.neckwear);
  items.push(...clothing.topwear);
  items.push(...clothing.handwear);
  items.push(...clothing.bottomwear);
  
  if (clothing.footwear) items.push(clothing.footwear);

  return items
      .map(item => `<div class="clothing-item">${item.replace(/_/g,' ')}</div>`)
      .join('');
}

// ============= RENDER FUNCTIONS =============
function renderWeatherDisplay(weatherData) {
  const { temperature, humidity, windSpeed, symbolCode, time, ultravioletIndex} = weatherData;
  const weatherInfo = weatherSymbols[symbolCode] || { emoji: '🌤️', label: 'Weather' };
  const thermometerPos = getThermometerPosition(temperature);

  const clothing = getClothing({
      temp: temperature,
      wind: weatherData.windMs,
      rain: weatherData.rain,
      snow: weatherData.snow,
      cloud: weatherData.cloud,
      isDay: weatherData.isDay
  });

  const lastUpdateStr = time.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
  });

  const contentHTML = `
      <div class="main-content">
          <div class="character-section">
              <div class="clothing-list">
                  ${renderClothingList(clothing)}
              </div>
              <div class="weather-description">${weatherInfo.label}</div>
          </div>

          <div class="data-section">
              <div class="temperature-display">
                  <div>
                      <div class="temp-number">${temperature}<span class="temp-unit">°C</span></div>
                  </div>
                  <div class="thermometer">
                      <div class="thermometer-track">
                          <div class="thermometer-needle" style="left: ${thermometerPos}%"></div>
                      </div>
                      <div class="temp-range-labels">
                          <span>50°C</span>
                          <span>30°C</span>
                          <span>20°C</span>
                          <span>10°C</span>
                          <span>0°C</span>
                          <span>-10°C</span>
                      </div>
                  </div>
              </div>

              <div class="other-data">
                  <div class="data-item">
                      <div class="data-label">Humidity</div>
                      <div class="data-value">${humidity}%</div>
                  </div>
                  <div class="data-item">
                      <div class="data-label">Wind Speed</div>
                      <div class="data-value">${windSpeed} km/h</div>
                  </div>
                  <div class="data-item">
                      <div class="data-label">UV Index</div>
                      <div class="data-value">${ultravioletIndex}</div>
                  </div>
              </div>
          </div>
      </div>
  `;

  document.getElementById('content').innerHTML = contentHTML;
  document.getElementById('lastUpdate').textContent = `Last updated: ${lastUpdateStr}`;
}

function renderError(message) {
  document.getElementById('content').innerHTML = `
      <div class="error">
          <strong>Error:</strong> ${message}
      </div>
  `;
}

// ============= MAIN UPDATE FUNCTION =============
async function updateWeather() {
  try {
      const rawData = await fetchWeatherData(CONFIG.latitude, CONFIG.longitude);
      const weatherData = processWeatherData(rawData);
      renderWeatherDisplay(weatherData);
  } catch (error) {
      renderError(`Failed to load weather data. Please try again later.`);
  }
}

// ============= INITIALIZATION =============
function initialize() {
  document.getElementById('locationName').textContent = CONFIG.locationName;
  
  updateWeather();
  setInterval(updateWeather, CONFIG.updateIntervalMinutes * 60 * 1000);
}

// ============= CLOTHING ALGORITHM =============
function getClothing(weather) {
  const {
    temp,
    wind,
    rain,
    snow,
    cloud,
    isDay
  } = weather;
  
  const feelsLike = temp - (wind * 0.7);

  const clothing = {
    headwear: [],
    neckwear: [],
    topwear: [],
    handwear: [],
    bottomwear: [],
    footwear: null,
    fullbody: null
  };

  const snowing = snow > 0;
  const raining = rain > 0;

  if (temp <= -5 || (temp <= 0 && snowing)) {
    clothing.fullbody = "snowsuit";

    clothing.headwear.push("beanie");
    clothing.handwear.push("gloves");
    clothing.footwear = "boots";

    return clothing;
  }

  if (temp <= 5 || snowing) {
    clothing.footwear = "boots";
  } 
  else if (rain >= 2) {
    clothing.footwear = "rubber_boots";
  }
  else if (temp >= 22 && !raining) {
    clothing.footwear = "sandals";
  } 
  else {
    clothing.footwear = "shoes";
  }

  if (temp >= 20 && rain < 1) {
    clothing.bottomwear.push("shorts");
  } else {
    clothing.bottomwear.push("pants");
  }

  if (temp >= 18) {
    clothing.topwear.push("short_sleeve_shirt");
  } else {
    clothing.topwear.push("long_sleeve_shirt");
  }

  if (rain > 0) {
    clothing.topwear.push("raincoat");
  } 
  else if (temp <= 12 || wind >= 8) {
    clothing.topwear.push("jacket");
  }

  if (feelsLike <= 4 || (temp <= 7 && wind >= 8)) {
    clothing.handwear.push("gloves");
  }

  if (feelsLike <= 7 || wind >= 10) {
    clothing.neckwear.push("scarf");
  }

  if (feelsLike <= 5 || wind >= 8) {
    clothing.headwear.push("beanie");
  }
  else if (temp >= 22 && cloud < 40) {
    clothing.headwear.push("sunhat");
  }

  if (isDay && cloud < 30) {
    clothing.headwear.push("sunglasses");
  }

  return clothing;
}

// Start when DOM is ready
document.addEventListener('DOMContentLoaded', initialize);
