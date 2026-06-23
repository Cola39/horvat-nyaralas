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
  let html = `<table><thead><tr><th>Költségek</th><th>Összeg</th></tr></thead><tbody>`;
  
  data.forEach(row => {
    const label = row[0]; 
    let value = row[1];   

    if (label === "" || label === "Per fő" || label === "Még fizetendő") return; 

    // Handle "Összesen" and "Még fizetendő" specifically at the end
  // Inside renderTable, replace your "Összesen" row logic with this:
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
      <tr style="background-color: transparent;">
        <td>Még fizetendő</td>
        <td>
           <div style="display: flex; justify-content: space-between;">
              <span id="megFizetendoLabel">0 Ft</span>
              <span id="megFizetendoPerFoLabel" style="font-weight: normal; color: #555;">0 Ft/fő</span>
           </div>
        </td>
      </tr>`;
  } else {
      // Normal input rows
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

// Calculates the live sum based on currency selection
// Inside renderTable, replace your "Összesen" row logic with this:
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
    <tr style="background-color: transparent;">
      <td>Még fizetendő</td>
      <td>
         <div style="display: flex; justify-content: space-between;">
            <span id="megFizetendoLabel">0 Ft</span>
            <span id="megFizetendoPerFoLabel" style="font-weight: normal; color: #555;">0 Ft/fő</span>
         </div>
      </td>
    </tr>`;
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
