const scriptURL = 'https://script.google.com/macros/s/AKfycbxNCN0v54YmAPkFwv_Ie892IsvF80uAHt25lV56SYq4nvfEgvJLRnTANShnuIqYvgqvog/exec'; 
const fetchURL = scriptURL + "?type=budget&t=" + new Date().getTime();

// We store the live exchange rate here
let exchangeRate = 400; 

window.onload = function() {
  fetch(fetchURL)
    .then(response => response.json())
    .then(data => {
      // If we receive the NEW data package from Google
      if (data && data.rows) {
        exchangeRate = data.exchangeRate || 400;
        renderTable(data.rows);
      } 
      // If we receive the OLD data format (just an array)
      else if (Array.isArray(data)) {
        console.warn("Még a régi adat érkezik a Google-től!");
        exchangeRate = 400; // Fallback rate
        renderTable(data);
      }
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
  
  data.forEach(row => {
    const label = row[0]; 
    let value = row[1];   

    if (label === "" && value === "") return; 

    // Handle the "Összesen" row specially
    if (label === "Összesen") {
      html += `<tr class="total-row">
                 <td>${label}</td>
                 <td><span class="static-value" id="totalSumLabel">0 Ft</span><br>
                 <small id="perFoLabel" style="color: #666;"></small></td>
               </tr>`;
    } 
    // Handle all other rows
    else {
      let isTotalRelated = label.includes("Per fő") || label.includes("Még fizetendő");
      
      html += `<tr>
                 <td>${label}</td>
                 <td>`;
      
      if (isTotalRelated) {
        html += `<span class="static-value">0 Ft</span>`;
      } else {
        let numValue = parseFloat(value);
        let defaultCurrency = (!isNaN(numValue) && numValue < 1000) ? '€' : 'Ft';

        html += `<div class="input-group">
                   <input type="text" class="cost-input" data-label="${label}" value="${value}" oninput="autoCurrency(this); updateTotal();">
                   <select id="currency-${label}" onchange="updateTotal()">
                     <option value="Ft" ${defaultCurrency === 'Ft' ? 'selected' : ''}>Ft</option>
                     <option value="€" ${defaultCurrency === '€' ? 'selected' : ''}>€</option>
                   </select>
                 </div>`;
      }
      html += `</td></tr>`;
    }
  });

  html += `</tbody></table>`;
  document.getElementById('tableContainer').innerHTML = html;
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
        totalHuf += (val * exchangeRate);
      } else {
        totalHuf += val;
      }
    }
  });

  // 1. Update total sum
  const formattedTotal = Math.round(totalHuf).toLocaleString('hu-HU');
  document.getElementById('totalSumLabel').innerText = formattedTotal + ' Ft';

  // 2. Perform your new calculations
  // Assuming you have fixed labels in your sheet for these:
  // "Per fő" (Total / 2)
  // "Még fizetendő" (Result - Paid amount)
  
  const perFoValue = Math.round(totalHuf / 2).toLocaleString('hu-HU');
  document.getElementById('perFoLabel').innerText = perFoValue + ' Ft/fő';
  
  // Find your table elements by their text content or specific IDs if you add them
  // A simple way is to target the rows by their text
  const rows = document.querySelectorAll('tbody tr');
  rows.forEach(row => {
    const label = row.querySelector('td:first-child').innerText;
    if (label.includes("Per fő")) {
      row.querySelector('.static-value').innerText = perFoValue + ' Ft/fő';
    }
    if (label.includes("Még fizetendő")) {
      // You can add logic here to subtract whatever amount is already paid
      row.querySelector('.static-value').innerText = "0 Ft/fő"; 
    }
  });
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
