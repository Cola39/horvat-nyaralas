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
      
      // Golyóálló árfolyam formázás: fixen 2 tizedesjegy, tizedesvesszővel
      const parsedRate = parseFloat(String(exchangeRate).replace(',', '.'));
      const formattedRate = !isNaN(parsedRate) ? parsedRate.toFixed(2).replace('.', ',') : exchangeRate;
      
      document.getElementById('exchangeRateDisplay').innerText = `${formattedRate} Ft = 1€`;
      
      renderTable(latestData);
    })
    .catch(err => {
      document.getElementById('tableContainer').innerHTML = "<p class='error'>Hiba a betöltéskor.</p>";
      console.error(err);
    });
};

function renderTable(data) {
  let html = `<table><thead><tr><th>Költségek</th><th>Összeg</th></tr></thead><tbody>`;
  
  data.forEach((row, index) => {
    const label = row[0];
    const value = row[1];

    if (!label || label === "Per fő" || label === "Még fizetendő" || label === "Összesen") return;

    // A Google Sheet képleted alapján a B3, B5, B6, B7 sorok a "még fizetendő".
    // A JS tömbben (mivel az A2 a 0. elem), ezek az 1, 3, 4, 5-ös indexek.
    const isUnpaidRow = [1, 3, 4, 5].includes(index);

    const isEuro = !isNaN(parseFloat(value)) && parseFloat(value) < 1000;
    html += `<tr>
           <td>${label}</td>
           <td>
             <div class="input-group">
               <input type="text" class="cost-input" data-label="${label}" data-unpaid="${isUnpaidRow}" value="${value}" oninput="autoCurrency(this); updateTotal();">
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

// EZ VOLT A HIÁNYZÓ FÜGGVÉNY: Segédfüggvény az ezres elválasztókhoz
function formatHuf(amount) {
  return Math.round(amount).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

function updateTotal() {
  let totalHuf = 0;
  let remainingHuf = -6500;

  document.querySelectorAll('.cost-input').forEach(input => {
    const val = parseFloat(input.value) || 0;
    const label = input.getAttribute('data-label');
    const isUnpaid = input.getAttribute('data-unpaid') === 'true';
    const currency = document.querySelector(`.currency-select[data-label="${label}"]`).value;
    
    // Átváltás Forintra (ha Euró)
    const valueInHuf = (currency === '€') ? (val * exchangeRate) : val;
    
    totalHuf += valueInHuf;
    
    // Ha a sor a "még fizetendő" kategóriába tartozik
    if (isUnpaid) {
      remainingHuf += valueInHuf;
    }
  });

  document.getElementById('totalSumLabel').innerText = `${formatHuf(totalHuf)} Ft`;
  document.getElementById('totalPerFoLabel').innerText = `${formatHuf(totalHuf / 2)} Ft/fő`;
  document.getElementById('megFizetendoLabel').innerText = `${formatHuf(remainingHuf)} Ft`;
  document.getElementById('megFizetendoPerFoLabel').innerText = `${formatHuf(remainingHuf / 2)} Ft/fő`;
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