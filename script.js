const scriptURL = 'https://script.google.com/macros/s/AKfycbxNCN0v54YmAPkFwv_Ie892IsvF80uAHt25lV56SYq4nvfEgvJLRnTANShnuIqYvgqvog/exec'; 
const fetchURL = scriptURL + "?type=budget&t=" + new Date().getTime();

let exchangeRate = 400; 
window.latestData = []; // Global storage for B9 lookup

window.onload = function() {
  fetch(fetchURL)
    .then(response => response.json())
    .then(data => {
      // Store the rows globally so updateTotal can access them later
      window.latestData = data.rows || data;
      
      if (data && data.rows) {
        exchangeRate = data.exchangeRate || 400;
        renderTable(data.rows);
      } else if (Array.isArray(data)) {
        exchangeRate = 400;
        renderTable(data);
      }
    })
    .catch(error => {
      document.getElementById('tableContainer').innerHTML = "<p style='color:red; padding: 20px;'>Hiba a betöltéskor.</p>";
      console.error(error);
    });
};

function getSheetValueByLabel(data, labelToFind) {
  if (!data) return 0;
  const row = data.find(r => r[0] === labelToFind);
  return row ? parseFloat(row[1]) || 0 : 0;
}

function renderTable(data) {
  let html = `<table><thead><tr><th>Költségek</th><th>Összeg</th></tr></thead><tbody>`;
  
  data.forEach(row => {
    const label = row[0]; 
    let value = row[1];   

    if (label === "" || label === "Per fő" || label === "Még fizetendő") return; 

    if (label === "Összesen") {
      html += `
        <tr class="total-row">
          <td>Összesen</td>
          <td>
             <div style="display: flex; justify-content: space-between;">
                <span id="totalSumLabel">0 Ft</span>
                <span id="totalPerFoLabel" style="font-weight: normal; color: #555;">0 Ft/fő</span>
             </div>
          </td>
        </tr>
        <tr>
          <td>Még fizetendő</td>
          <td>
             <div style="display: flex; justify-content: space-between;">
                <span id="megFizetendoLabel">0 Ft</span>
                <span id="megFizetendoPerFoLabel" style="font-weight: normal; color: #555;">0 Ft/fő</span>
             </div>
          </td>
        </tr>`;
    } else {
      let numValue = parseFloat(value);
      let defaultCurrency = (!isNaN(numValue) && numValue < 1000) ? '€' : 'Ft';

      html += `<tr>
                 <td>${label}</td>
                 <td>
                   <div class="input-group">
                     <input type="text" class="cost-input" data-label="${label}" value="${value}" oninput="autoCurrency(this); updateTotal();">
                     <select id="currency-${label}" onchange="updateTotal()">
                       <option value="Ft" ${defaultCurrency === 'Ft' ? 'selected' : ''}>Ft</option>
                       <option value="€" ${defaultCurrency === '€' ? 'selected' : ''}>€</option>
                     </select>
                   </div>
                 </td>
               </tr>`;
    }
  });

  html += `</tbody></table>`;
  document.getElementById('tableContainer').innerHTML = html;
  updateTotal();
}

function updateTotal() {
  let totalHuf = 0;
  document.querySelectorAll('.cost-input').forEach(input => {
    const val = parseFloat(input.value) || 0;
    const label = input.getAttribute('data-label');
    const currency = document.getElementById('currency-' + label).value;
    totalHuf += (currency === '€') ? (val * exchangeRate) : val;
  });

  // Get the raw value from Google Sheet B9
  const remainingRaw = getSheetValueByLabel(window.latestData, "Még fizetendő"); 

  // Update labels
  document.getElementById('totalSumLabel').innerText = Math.round(totalHuf).toLocaleString('hu-HU') + ' Ft';
  document.getElementById('totalPerFoLabel').innerText = Math.round(totalHuf / 2).toLocaleString('hu-HU') + ' Ft/fő';
  
  // Display the raw value from the sheet
  document.getElementById('megFizetendoLabel').innerText = Math.round(remainingRaw).toLocaleString('hu-HU') + ' Ft';
  document.getElementById('megFizetendoPerFoLabel').innerText = Math.round(remainingRaw / 2).toLocaleString('hu-HU') + ' Ft/fő';
}

function autoCurrency(inputElement) {
  const val = parseFloat(inputElement.value);
  const label = inputElement.getAttribute('data-label');
  const selectElement = document.getElementById('currency-' + label);
  if (!isNaN(val)) {
    selectElement.value = (val < 1000) ? '€' : 'Ft';
  }
}

function saveData() {
  const inputs = document.querySelectorAll('input[type="text"]');
  const formData = new URLSearchParams();
  formData.append("type", "budget");
  inputs.forEach(input => {
    formData.append(input.getAttribute('data-label'), input.value.trim());
  });

  const button = document.querySelector('button');
  const originalText = button.innerText;
  button.innerText = 'Mentés folyamatban...';

  fetch(scriptURL, { method: 'POST', body: formData })
  .then(() => {
    alert('Sikeresen mentve!');
    location.reload();
  })
  .catch(() => alert('Hiba történt a mentés során.'));
}
