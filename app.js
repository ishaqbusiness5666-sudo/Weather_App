let weatherData = null;
let currentCity = { name: "Kandhkot", latitude: 28.24, longitude: 69.29, country: "Pakistan" };
let unit = "C";
let debounceTimer;

const WEATHER_CODES = {
    0: { label: "Clear sky", icon: "☀️" }, 1: { label: "Mainly clear", icon: "🌤️" },
    2: { label: "Partly cloudy", icon: "⛅" }, 3: { label: "Overcast", icon: "☁️" },
    45: { label: "Fog", icon: "🌫️" }, 48: { label: "Rime fog", icon: "🌫️" },
    51: { label: "Light drizzle", icon: "🌦️" }, 53: { label: "Moderate drizzle", icon: "🌦️" },
    55: { label: "Dense drizzle", icon: "🌦️" }, 61: { label: "Slight rain", icon: "🌧️" },
    63: { label: "Moderate rain", icon: "🌧️" }, 65: { label: "Heavy rain", icon: "🌧️" },
    71: { label: "Slight snow", icon: "❄️" }, 73: { label: "Moderate snow", icon: "❄️" },
    75: { label: "Heavy snow", icon: "❄️" }, 95: { label: "Thunderstorm", icon: "⛈️" }
};

const citySearch = document.getElementById("citySearch");
const searchDropdown = document.getElementById("searchDropdown");
const unitToggle = document.getElementById("unitToggle");
const loadingEl = document.getElementById("loading");
const errorEl = document.getElementById("error");
const weatherContent = document.getElementById("weatherContent");

function animate(targets, vars) {
    if (window.gsap) gsap.to(targets, vars);
}

function init() {
    lucide.createIcons();
    loadWeather(currentCity);

    citySearch.addEventListener("input", (event) => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => searchCities(event.target.value), 300);
    });
    unitToggle.addEventListener("click", toggleUnit);
    document.addEventListener("click", (event) => {
        if (!citySearch.contains(event.target) && !searchDropdown.contains(event.target)) {
            searchDropdown.classList.add("hidden");
        }
    });

    if (window.gsap) {
        gsap.from(".site-header", { opacity: 0, y: -18, duration: .8, ease: "power2.out" });
        gsap.from(".brand-mark", { scale: .7, rotation: -12, delay: .2, duration: .7, ease: "back.out(1.7)" });
    }
}

async function searchCities(query) {
    if (query.length < 2) {
        searchDropdown.classList.add("hidden");
        return;
    }
    try {
        const response = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=5&language=en&format=json`);
        const data = await response.json();
        if (!data.results?.length) {
            searchDropdown.classList.add("hidden");
            return;
        }
        searchDropdown.innerHTML = data.results.map((city) => `
            <button class="search-result" data-city='${JSON.stringify(city).replace(/'/g, "&#39;")}' type="button">
                <strong>${city.name}</strong>
                <small>${city.admin1 ? `${city.admin1}, ` : ""}${city.country}</small>
            </button>
        `).join("");
        searchDropdown.querySelectorAll(".search-result").forEach((button) => {
            button.addEventListener("click", () => selectCity(JSON.parse(button.dataset.city)));
        });
        searchDropdown.classList.remove("hidden");
        animate(".search-result", { opacity: 1, y: 0, duration: .25, stagger: .04, ease: "power2.out" });
    } catch (error) {
        console.error("Search error:", error);
    }
}

function selectCity(city) {
    currentCity = city;
    citySearch.value = "";
    searchDropdown.classList.add("hidden");
    loadWeather(city);
}

async function loadWeather(city) {
    showState("loading");
    try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${city.latitude}&longitude=${city.longitude}&current=temperature_2m,weather_code,wind_speed_10m,relative_humidity_2m&hourly=temperature_2m,weather_code&daily=temperature_2m_max,temperature_2m_min,weather_code,sunrise,sunset,rain_sum&timezone=auto`;
        const response = await fetch(url);
        if (!response.ok) throw new Error("Weather service is unavailable right now.");
        weatherData = await response.json();
        renderWeather();
        showState("content");
    } catch (error) {
        document.getElementById("errorMessage").innerText = error.message;
        showState("error");
    }
}

function toggleUnit() {
    unit = unit === "C" ? "F" : "C";
    document.getElementById("unitText").innerText = `°${unit}`;
    renderWeather();
}

function convertTemp(celsius) {
    return unit === "C" ? Math.round(celsius) : Math.round((celsius * 9 / 5) + 32);
}

function renderWeather() {
    if (!weatherData) return;
    const current = weatherData.current;
    const daily = weatherData.daily;
    const interpretation = WEATHER_CODES[current.weather_code] || { label: "Clear", icon: "☀️" };

    document.getElementById("cityName").innerText = `${currentCity.name}, ${currentCity.country}`;
    document.getElementById("currentDate").innerText = new Date().toLocaleDateString("en-US", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
    document.getElementById("mainTemp").innerText = `${convertTemp(current.temperature_2m)}°`;
    document.getElementById("mainUnit").innerText = `/${unit}`;
    document.getElementById("conditionText").innerText = interpretation.label;
    document.getElementById("conditionIcon").innerText = interpretation.icon;
    document.getElementById("mainIcon").innerText = interpretation.icon;
    document.getElementById("todayHigh").innerText = `${convertTemp(daily.temperature_2m_max[0])}°`;
    document.getElementById("todayLow").innerText = `${convertTemp(daily.temperature_2m_min[0])}°`;
    document.getElementById("todayRain").innerText = `${daily.rain_sum[0]}mm`;
    document.getElementById("statHumidity").innerText = `${current.relative_humidity_2m}%`;
    document.getElementById("statWind").innerText = `${current.wind_speed_10m} km/h`;
    document.getElementById("statSunrise").innerText = daily.sunrise[0].split("T")[1];
    document.getElementById("statSunset").innerText = daily.sunset[0].split("T")[1];

    const hourlyContainer = document.getElementById("hourlyContainer");
    const now = new Date();
    const hourIdx = Math.max(weatherData.hourly.time.findIndex((time) => new Date(time) >= now), 0);
    hourlyContainer.innerHTML = weatherData.hourly.time.slice(hourIdx, hourIdx + 24).map((time, index) => {
        const date = new Date(time);
        const displayTime = date.getHours() === now.getHours() ? "Now" : `${date.getHours()}:00`;
        const code = weatherData.hourly.weather_code[hourIdx + index];
        return `<div class="hourly-card glass-card-sm"><span class="hourly-time">${displayTime}</span><span class="hourly-icon">${WEATHER_CODES[code]?.icon || "☀️"}</span><span class="hourly-temp">${convertTemp(weatherData.hourly.temperature_2m[hourIdx + index])}°</span></div>`;
    }).join("");

    document.getElementById("dailyList").innerHTML = daily.time.map((time, index) => {
        const date = new Date(time);
        const dayName = index === 0 ? "Today" : date.toLocaleDateString("en-US", { weekday: "long" });
        const interpretation = WEATHER_CODES[daily.weather_code[index]] || { label: "Clear", icon: "☀️" };
        return `<div class="daily-row"><div class="day-name">${dayName}<span class="day-date">${date.toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span></div><div class="day-condition"><span>${interpretation.icon}</span><span>${interpretation.label}</span></div><div class="day-temperatures"><span class="day-high">${convertTemp(daily.temperature_2m_max[index])}°</span><span class="day-low">${convertTemp(daily.temperature_2m_min[index])}°</span></div></div>`;
    }).join("");

    lucide.createIcons();
}

function showState(state) {
    loadingEl.classList.toggle("hidden", state !== "loading");
    errorEl.classList.toggle("hidden", state !== "error");
    weatherContent.classList.toggle("hidden", state !== "content");
    if (state === "loading") animate("#loading", { opacity: 1, duration: .3 });
    if (state === "content") {
        animate("#weatherContent", { opacity: 1, duration: .5 });
        animate(".current-card, .stat-card", { opacity: 1, y: 0, duration: .65, stagger: .08, ease: "power2.out" });
        animate(".hourly-card, .daily-row", { opacity: 1, y: 0, duration: .45, stagger: .035, delay: .15, ease: "power2.out" });
        if (window.gsap) gsap.to(".main-icon", { y: -8, duration: 3.5, repeat: -1, yoyo: true, ease: "sine.inOut" });
    }
}

function loadDefaultWeather() {
    currentCity = { name: "Kandhkot", latitude: 28.24, longitude: 69.29, country: "Pakistan" };
    loadWeather(currentCity);
}

window.loadDefaultWeather = loadDefaultWeather;
window.addEventListener("load", init);
