const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxNCN0v54YmAPkFwv_Ie892IsvF80uAHt25lV56SYq4nvfEgvJLRnTANShnuIqYvgqvog/exec';
const FETCH_URL = `${SCRIPT_URL}?type=budget&t=${new Date().getTime()}`;

let exchangeRate = 400;
let latestData = [];

window.onload = () => {
  fetch(FETCH_URL)
    .then(res => res.json())
    .then(data => {
      latestData = data.rows || data;
      exchangeRate = data.exchangeRate || 400;

      // Megjelenítjük az aktuális árfolyamot 2 tizedesjeggyel, magyar formátumban
      const formattedRate = Number(exchangeRate).toLocaleString('hu-HU', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      });
      document.getElementById('exchangeRateDisplay').innerText = `${exchangeRate} Ft = 1€`;

      renderTable(latestData);
    })
    .catch(err => {
      document.getElementById('tableContainer').innerHTML = "<p class='error'>Hiba a betöltéskor.</p>";
      console.error(err);
    });
};

function renderTable(data) {
  let html = `<table><thead><tr><th>Költségek</th><th>Összeg</th></tr></thead><tbody>`;

  data.forEach(row => {
    const label = row[0];
    const value = row[1];

    // Kihagyjuk a statikus összegző sorokat a bal oldali fő táblázatból
    if (!label || label === "Per fő" || label === "Még fizetendő" || label === "Összesen") return;

    const isEuro = !isNaN(parseFloat(value)) && parseFloat(value) < 1000;
    html += `<tr>
           <td>${label}</td>
           <td>
             <div class="input-group">
               <input type="text" class="cost-input" data-label="${label}" value="${value}" oninput="autoCurrency(this); updateTotal();">
               <select class="currency-select" data-label="${label}" onchange="updateTotal()">
                 <option value="Ft" ${!isEuro ? 'selected' : ''}>Ft</option>
                 <option value="€" ${isEuro ? 'selected' : ''}>€</option>
               </select>
             </div>
           </td>
         </tr>`;
  });

  document.getElementById('tableContainer').innerHTML = html + `</tbody></table>`;
  updateTotal();
}

function updateTotal() {
  let totalHuf = 0;
  document.querySelectorAll('.cost-input').forEach(input => {
    const val = parseFloat(input.value) || 0;
    const label = input.getAttribute('data-label');
    const currency = document.querySelector(`.currency-select[data-label="${label}"]`).value;
    totalHuf += (currency === '€') ? (val * exchangeRate) : val;
  });

  const baseRemaining = (latestData.find(r => r[0] === "Még fizetendő") || [0, 0])[1] || 0;

  // Frissítjük a jobb oldali kártya értékeit
  document.getElementById('totalSumLabel').innerText = `${Math.round(totalHuf).toLocaleString('hu-HU')} Ft`;
  document.getElementById('totalPerFoLabel').innerText = `${Math.round(totalHuf / 2).toLocaleString('hu-HU')} Ft/fő`;
  document.getElementById('megFizetendoLabel').innerText = `${Math.round(baseRemaining).toLocaleString('hu-HU')} Ft`;
  document.getElementById('megFizetendoPerFoLabel').innerText = `${Math.round(baseRemaining / 2).toLocaleString('hu-HU')} Ft/fő`;
}

function autoCurrency(el) {
  const val = parseFloat(el.value);
  const sel = document.querySelector(`.currency-select[data-label="${el.getAttribute('data-label')}"]`);
  if (!isNaN(val)) sel.value = (val < 1000) ? '€' : 'Ft';
}

function saveData() {
  const btn = document.querySelector('button');
  btn.innerText = 'Mentés folyamatban...';
  btn.disabled = true;

  const formData = new URLSearchParams();
  formData.append("type", "budget");
  document.querySelectorAll('.cost-input').forEach(i => formData.append(i.dataset.label, i.value.trim()));

  fetch(SCRIPT_URL, { method: 'POST', body: formData })
    .then(() => { alert('Sikeresen mentve!'); location.reload(); })
    .catch(() => { alert('Hiba történt!'); btn.disabled = false; btn.innerText = 'Mentés'; });
}