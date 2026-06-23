const scriptURL = 'https://script.google.com/macros/s/AKfycbxNCN0v54YmAPkFwv_Ie892IsvF80uAHt25lV56SYq4nvfEgvJLRnTANShnuIqYvgqvog/exec'; 
const fetchURL = scriptURL + "?type=budget";

// We store the live exchange rate here
let exchangeRate = 400; 

window.onload = function() {
  fetch(fetchURL)
    .then(response => response.json())
    .then(data => {
      // data now contains both the rate and the rows from our new Code.gs
      exchangeRate = data.exchangeRate || 400;
      renderTable(data.rows);
    })
    .catch(error => {
      document.getElementById('tableContainer').innerHTML = "<p style='color:red; padding: 20px;'>Hiba a betöltéskor.</p>";
      console.error(error);
    });
};

function renderTable(data) {
  let html = `
    <table>
      <thead>
        <tr>
          <th>Költségek</th>
          <th>Összeg</th>
        </tr>
      </thead>
      <tbody>
  `;
  
  let isLocked = false;

  data.forEach(row => {
    const label = row[0]; 
    let value = row[1];   

    if (label === "" && value === "") return; 

    if (label === "Összesen") {
      isLocked = true;
    }

    html += `<tr class="${label === 'Összesen' ? 'total-row' : ''}">`;
    html += `<td>${label}</td>`;

    if (isLocked) {
      // We give the total a special ID so we can update it live
      html += `<td><span class="static-value" id="totalSumLabel">0 Ft</span></td>`;
    } else {
      let numValue = parseFloat(value);
      let defaultCurrency = 'Ft'; 
      
      if (!isNaN(numValue) && numValue < 1000) {
        defaultCurrency = '€';
      }

      // Added classes and an onchange event so it calculates live when you type!
      html += `<td>
        <div class="input-group">
          <input type="text" class="cost-input" data-label="${label}" value="${value}" oninput="autoCurrency(this); updateTotal();">
          <select id="currency-${label}" onchange="updateTotal()">
            <option value="Ft" ${defaultCurrency === 'Ft' ? 'selected' : ''}>Ft</option>
            <option value="€" ${defaultCurrency === '€' ? 'selected' : ''}>€</option>
          </select>
        </div>
      </td>`;
    }
    
    html += `</tr>`;
  });

  html += `</tbody></table>`;
  document.getElementById('tableContainer').innerHTML = html;
  
  // Calculate the total immediately after rendering the table
  updateTotal();
}

// Calculates the live sum based on currency selection
function updateTotal() {
  let totalHuf = 0;
  const inputs = document.querySelectorAll('.cost-input');
  
  inputs.forEach(input => {
    const val = parseFloat(input.value);
    if (!isNaN(val)) {
      const label = input.getAttribute('data-label');
      const currency = document.getElementById('currency-' + label).value;
      
      if (currency === '€') {
        // Multiply EUR by the live exchange rate
        totalHuf += (val * exchangeRate);
      } else {
        // Add HUF exactly as it is
        totalHuf += val;
      }
    }
  });

  // Format the final number nicely (e.g., 150 000 Ft) and update the screen
  document.getElementById('totalSumLabel').innerText = Math.round(totalHuf).toLocaleString('hu-HU') + ' Ft';
}

function autoCurrency(inputElement) {
  const val = parseFloat(inputElement.value);
  const label = inputElement.getAttribute('data-label');
  const selectElement = document.getElementById('currency-' + label);
  
  if (!isNaN(val)) {
    if (val < 1000) {
      selectElement.value = '€';
    } else {
      selectElement.value = 'Ft';
    }
  }
}

function saveData() {
  const inputs = document.querySelectorAll('input[type="text"]');
  const formData = new URLSearchParams();

  formData.append("type", "budget");

  inputs.forEach(input => {
    const label = input.getAttribute('data-label');
    const value = input.value;
    formData.append(label, value.trim());
  });

  const button = document.querySelector('button');
  const originalText = button.innerText;
  button.innerText = 'Mentés folyamatban... (Saving...)';

  fetch(scriptURL, {
    method: 'POST',
    body: formData 
  })
  .then(response => {
    if (!response.ok) throw new Error('Hálózati hiba (Network error)');
    alert('A táblázat sikeresen frissítve lett!');
    button.innerText = originalText;
    location.reload(); 
  })
  .catch(error => {
    console.error('Hiba (Error)!', error);
    alert('Hiba történt a mentés során.');
    button.innerText = originalText;
  });
}
