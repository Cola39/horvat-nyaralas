async function fetchWeather() {
    // Rovinj koordinátái, fixálva a nyaralás idejére (2026. júl. 3 - júl. 7)
    const url = 'https://api.open-meteo.com/v1/forecast?latitude=45.0812&longitude=13.6387&daily=weathercode,temperature_2m_max,temperature_2m_min&timezone=auto&start_date=2026-07-03&end_date=2026-07-07';

    try {
        const response = await fetch(url);
        const data = await response.json();

        if (data.error) {
            console.error("API Hiba:", data.reason);
            document.getElementById('weather-body').innerHTML = '<tr><td colspan="4" class="center-text">Hiba: Nem sikerült lekérni a fix dátumokat.</td></tr>';
            return;
        }

        renderWeather(data.daily);
    } catch (error) {
        document.getElementById('weather-body').innerHTML = '<tr><td colspan="4" class="center-text">Hiba történt az adatok lekérésekor.</td></tr>';
        console.error("Weather API error:", error);
    }
}

function getWeatherEmoji(code) {
    // WMO Időjárási kódok fordítása emojira
    if (code === 0) return '☀️'; // Tiszta
    if (code === 1 || code === 2 || code === 3) return '⛅'; // Részben felhős
    if (code >= 45 && code <= 48) return '🌫️'; // Köd
    if (code >= 51 && code <= 67) return '🌧️'; // Eső/Szitálás
    if (code >= 71 && code <= 77) return '❄️'; // Hó (Rovinjban ritka, de benne hagyjuk)
    if (code >= 80 && code <= 82) return '🌦️'; // Zápor
    if (code >= 95 && code <= 99) return '⛈️'; // Zivatar
    return '🌤️';
}

function getDayName(dateString, index) {
    const days = ['vasárnap', 'hétfő', 'kedd', 'szerda', 'csütörtök', 'péntek', 'szombat'];
    const months = ['január', 'február', 'március', 'április', 'május', 'június', 'július', 'augusztus', 'szeptember', 'október', 'november', 'december'];
    
    const date = new Date(dateString);
    const dayName = days[date.getDay()];
    const monthName = months[date.getMonth()];
    const dayNumber = date.getDate();
    
    // Formázás: "1. nap (péntek - július 3.)"
    return `${index + 1}. nap (${dayName} - ${monthName} ${dayNumber}.)`;
}

function renderWeather(daily) {
    const tbody = document.getElementById('weather-body');
    tbody.innerHTML = ''; // Töltés szöveg eltávolítása

    for (let i = 0; i < daily.time.length; i++) {
        const tr = document.createElement('tr');

        // Nap (Day)
        const tdDay = document.createElement('td');
        tdDay.textContent = getDayName(daily.time[i], i);

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

// Indítás az oldal betöltésekor
document.addEventListener('DOMContentLoaded', fetchWeather);
