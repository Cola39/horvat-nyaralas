async function fetchWeather() {
    // Coordinates for Rovinj, Croatia
    const url = 'https://api.open-meteo.com/v1/forecast?latitude=45.0812&longitude=13.6387&daily=weathercode,temperature_2m_max,temperature_2m_min&timezone=auto';

    try {
        const response = await fetch(url);
        const data = await response.json();
        renderWeather(data.daily);
    } catch (error) {
        document.getElementById('weather-body').innerHTML = '<tr><td colspan="4" class="center-text">Hiba történt az adatok lekérésekor.</td></tr>';
        console.error("Weather API error:", error);
    }
}

function getWeatherEmoji(code) {
    // WMO Weather interpretation codes
    if (code === 0) return '☀️'; // Clear
    if (code === 1 || code === 2 || code === 3) return '⛅'; // Partly cloudy
    if (code >= 45 && code <= 48) return '🌫️'; // Fog
    if (code >= 51 && code <= 67) return '🌧️'; // Rain/Drizzle
    if (code >= 71 && code <= 77) return '❄️'; // Snow (Unlikely in Rovinj summer, but just in case!)
    if (code >= 80 && code <= 82) return '🌦️'; // Showers
    if (code >= 95 && code <= 99) return '⛈️'; // Thunderstorm
    return '🌤️';
}

function getDayName(dateString, index) {
    const days = ['vasárnap', 'hétfő', 'kedd', 'szerda', 'csütörtök', 'péntek', 'szombat'];
    const date = new Date(dateString);
    const dayName = days[date.getDay()];
    // Formats exactly like your sheet: "1. nap (péntek)"
    return `${index + 1}. nap (${dayName})`;
}

function renderWeather(daily) {
    const tbody = document.getElementById('weather-body');
    tbody.innerHTML = ''; // Clear the loading text

    for (let i = 0; i < daily.time.length; i++) {
        const tr = document.createElement('tr');

        // Nap (Day)
        const tdDay = document.createElement('td');
        tdDay.textContent = getDayName(daily.time[i], i);
        tdDay.style.fontWeight = 'bold';

        // Időjárás (Weather Icon)
        const tdIcon = document.createElement('td');
        tdIcon.textContent = getWeatherEmoji(daily.weathercode[i]);
        tdIcon.classList.add('weather-icon', 'center-text');

        // Max Temp
        const tdMax = document.createElement('td');
        tdMax.textContent = Math.round(daily.temperature_2m_max[i]) + '°C';
        tdMax.classList.add('temp-max', 'center-text');

        // Min Temp
        const tdMin = document.createElement('td');
        tdMin.textContent = Math.round(daily.temperature_2m_min[i]) + '°C';
        tdMin.classList.add('temp-min', 'center-text');

        tr.appendChild(tdDay);
        tr.appendChild(tdIcon);
        tr.appendChild(tdMax);
        tr.appendChild(tdMin);

        tbody.appendChild(tr);
    }
}

// Run the fetch when the page loads
document.addEventListener('DOMContentLoaded', fetchWeather);