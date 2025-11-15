//---Script.js----//
//---Created My Own API KEY ---
const API_KEY = "KEEP_YOUR_OWN_API_KEY";//---USE YOUR OWN API KEY BY CREATING AN ACCOUNT IN OFFICIAL WEATHER APPS--
//-----BASE Weather and Forecast URLs for WFA--
const BASE_WEATHER = "https://api.openweathermap.org/data/2.5/weather";
const BASE_FORECAST = "https://api.openweathermap.org/data/2.5/forecast";
//-----DOM ELEMENTS for MY WF App---
const cityInput = document.getElementById("cityInput");
const searchBtn = document.getElementById("searchBtn");
const locBtn = document.getElementById("locBtn");
const recentSelect = document.getElementById("recentSelect");
const clearRecent = document.getElementById("clearRecent");
const unitToggle = document.getElementById("unitToggle");
const cityNameEl = document.getElementById("cityName");
const currentTempEl = document.getElementById("currentTemp");
const currentDetailsEl = document.getElementById("currentDetails");
const weatherIconEl = document.getElementById("weatherIcon");
const forecastContainer = document.getElementById("forecastContainer");
const errorMessage = document.getElementById("errorMessage");
const alertBox = document.getElementById("alertBox");
// Temperature Unit
let todaysUnit = "C";
// LocalStorage Key
const RECENT_KEY = "wf_recent_cities";
///////------Utility Functions------/
function kelvinToC(k) {
  return k - 273.15;
}

function kelvinToF(k) {
  return (k - 273.15) * 9 / 5 + 32;
}
function formatTemp(k, unit = "C") {
  return unit === "C"
    ? Math.round(kelvinToC(k)) + "°C"
    : Math.round(kelvinToF(k)) + "°F";
}
function showError(msg) {
  errorMessage.textContent = msg;
  errorMessage.classList.remove("hidden");

  setTimeout(() => {
    errorMessage.classList.add("hidden");
  }, 4000);
}

function showAlert(msg, style = "bg-yellow-100 text-yellow-800") {
  alertBox.textContent = msg;
  alertBox.className = `mt-4 p-3 rounded-md text-sm ${style}`;
  alertBox.classList.remove("hidden");
}

function hideAlert() {
  alertBox.classList.add("hidden");
}

function safeFetch(url) {
  return fetch(url).then((res) => {
    if (!res.ok) throw new Error("API Error: " + res.status);
    return res.json();
  });
}

//------MY REcent Searchs into My Local Storage--//

function loadRecents() {
  const raw = localStorage.getItem(RECENT_KEY);
  let arr = raw ? JSON.parse(raw) : [];

  recentSelect.innerHTML = "";

  if (arr.length === 0) {
    recentSelect.innerHTML = `<option>No recent Searches</option>`;
  } else {
    arr.forEach((city) => {
      const opt = document.createElement("option");
      opt.value = city;
      opt.textContent = city;
      recentSelect.appendChild(opt);
    });
  }
}

function addRecent(city) {
  if (!city) return;

  let arr = JSON.parse(localStorage.getItem(RECENT_KEY) || "[]");

  arr = [city, ...arr.filter((c) => c.toLowerCase() !== city.toLowerCase())].slice(0, 8);

  localStorage.setItem(RECENT_KEY, JSON.stringify(arr));
  loadRecents();
}

/// UI Rendering in my Weather ProJect---

function setBackgroundByWeather(main) {
  const body = document.body;

  if (main === "Clear") body.style.backgroundColor = "#fef3c7";
  else if (main === "Clouds") body.style.backgroundColor = "#e2e8f0";
  else if (main === "Rain" || main === "Drizzle") body.style.backgroundColor = "#cfe9ff";
  else if (main === "Snow") body.style.backgroundColor = "#f1f5f9";
  else if (main === "Thunderstorm") body.style.backgroundColor = "#fde68a";
  else body.style.backgroundColor = "#dff1ff";
}

function renderCurrent(data) {
  cityNameEl.textContent = `${data.name}, ${data.sys.country}`;

  currentTempEl.textContent = formatTemp(data.main.temp, todaysUnit);

  currentDetailsEl.textContent =
    `Humidity: ${data.main.humidity}% | ` +
    `Wind: ${Math.round(data.wind.speed)} m/s | ` +
    `${data.weather[0].description}`;

  const icon = data.weather[0].icon;
  weatherIconEl.innerHTML = `<img src="https://openweathermap.org/img/wn/${icon}@2x.png" />`;

  setBackgroundByWeather(data.weather[0].main);

  /// ---Main Alerts for Weather Changes---
  const cTemp = kelvinToC(data.main.temp);

  if (cTemp >= 40) {
    showAlert("Extreme heat! Stay hydrated.", "bg-red-100 text-red-800");
  } else if (cTemp <= -5) {
    showAlert("Very cold! Bundle up.", "bg-blue-100 text-blue-800");
  } else {
    hideAlert();
  }
}

// -------Forecast Aggregation------
function aggregateForecast(json) {
  const groups = {};
  json.list.forEach((item) => {
    const date = item.dt_txt.split(" ")[0];

    if (!groups[date]) groups[date] = [];
    groups[date].push(item);
  });

  return Object.keys(groups)
    .slice(0, 5)
    .map((date) => {
      const items = groups[date];

      const temps = items.map((i) => i.main.temp);

      return {
        date: date,
        avgTemp: temps.reduce((a, b) => a + b, 0) / temps.length,
        minTemp: Math.min(...temps),
        maxTemp: Math.max(...temps),
        humidity: Math.round(items.reduce((a, b) => a + b.main.humidity, 0) / items.length),
        icon: items[Math.floor(items.length / 2)].weather[0].icon,
      };
    });
}

function renderForecast(days) {
  forecastContainer.innerHTML = "";

  days.forEach((day) => {
    const dateObj = new Date(day.date);

    const div = document.createElement("div");
    div.className = "p-3 bg-blue-50 rounded-xl shadow text-center";

    div.innerHTML = `
      <p class="font-semibold">${dateObj.toDateString().slice(0, 10)}</p>
      <img src="https://openweathermap.org/img/wn/${day.icon}@2x.png">
      <p class="text-sm">Avg: ${Math.round(kelvinToC(day.avgTemp))}°C</p>
      <p class="text-xs text-gray-600">Max: ${Math.round(kelvinToC(day.maxTemp))}°C | Min: ${Math.round(kelvinToC(day.minTemp))}°C</p>
      <p class="text-xs text-gray-600 mt-1">Humidity: ${day.humidity}%</p>
    `;

    forecastContainer.appendChild(div);
  });
}

// used for fetching The Weather Data using ASYC Function with try and catch functions

async function fetchByCity(city) {
  if (!city) return showError("Enter a city name");

  hideAlert();

  try {
    const weather = await safeFetch(`${BASE_WEATHER}?q=${city}&appid=${API_KEY}`);
    const forecast = await safeFetch(`${BASE_FORECAST}?q=${city}&appid=${API_KEY}`);

    renderCurrent(weather);
    renderForecast(aggregateForecast(forecast));

    addRecent(city);
  } catch (err) {
    showError("City not found! Try again.");
  }
}

async function fetchByCoords(lat, lon) {
  try {
    const weather = await safeFetch(`${BASE_WEATHER}?lat=${lat}&lon=${lon}&appid=${API_KEY}`);
    const forecast = await safeFetch(`${BASE_FORECAST}?lat=${lat}&lon=${lon}&appid=${API_KEY}`);

    renderCurrent(weather);
    renderForecast(aggregateForecast(forecast));

    addRecent(weather.name);
  } catch (err) {
    showError("Unable to fetch location weather.");
  }
}

/// Event Listeners ---
//-----Search Buttons by Click Actions--
searchBtn.addEventListener("click", () => {
  fetchByCity(cityInput.value.trim());
});

///---Entering the Key
cityInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") fetchByCity(cityInput.value.trim());
});

// This used  finding or using your current location
locBtn.addEventListener("click", () => {
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      fetchByCoords(pos.coords.latitude, pos.coords.longitude);
    },
    () => showError("Location permission denied.")
  );
});
// for No recent Seaeches and changes
recentSelect.addEventListener("change", () => {
  if (recentSelect.value !== "No recent Searches") {
    fetchByCity(recentSelect.value);
  }
});

// For clearing recent Search
clearRecent.addEventListener("click", () => {
  localStorage.removeItem(RECENT_KEY);
  loadRecents();
});
//-----For unit toggle ,Because it Shows the F/C for the Weather changes
unitToggle.addEventListener("click", () => {
  todaysUnit = todaysUnit === "C" ? "F" : "C";
  unitToggle.textContent = "°" + todaysUnit;

//------Re-render current temperature only---
  const city = cityNameEl.textContent.split(",")[0];
  if (city !== "-") fetchByCity(city);
});

////Initilaizing for this Weather Forecast App---
loadRecents();
hideAlert();
