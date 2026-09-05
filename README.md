# Weather App

SkyCast is a responsive weather dashboard for current conditions, hourly forecasts, and a 7-day outlook for cities worldwide.

## Features

- City search with autocomplete suggestions
- Live weather data from Open-Meteo
- Celsius/Fahrenheit toggle
- Responsive soft-glass interface
- GSAP entrance, loading, and forecast animations
- Vanilla HTML, CSS, and JavaScript with no build step

## Run locally

Open `index.html` in a modern browser, or serve this folder with any static server. An internet connection is required for weather and city data.

## Files

- `index.html` - semantic page structure and external library references
- `styles.css` - responsive visual design and layout
- `app.js` - API requests, rendering, search, unit conversion, and GSAP motion

## APIs

- Weather: `https://api.open-meteo.com/v1/forecast`
- City search: `https://geocoding-api.open-meteo.com/v1/search`
