const scriptURL = 'https://script.google.com/macros/s/AKfycbxNCN0v54YmAPkFwv_Ie892IsvF80uAHt25lV56SYq4nvfEgvJLRnTANShnuIqYvgqvog/exec'; 

window.onload = function() {
  fetch(scriptURL)
    .then(response => response.json())
    .then(data => renderTable(data))
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
      let displayValue = value;
      if (value !== "" && !isNaN(value)) {
        let num = parseFloat(value);
        displayValue = (num < 1000) ? num + " €" : num + " Ft";
      }
      html += `<td><span class="static-value">${displayValue}</span></td>`;
    } else {
      let numValue = parseFloat(value);
      let defaultCurrency = 'Ft'; 
      
      if (!isNaN(numValue) && numValue < 1000) {
        defaultCurrency = '€';
      }

      html += `<td>
        <div class="input-group">
          <input type="text" data-label="${label}" value="${value}" oninput="autoCurrency(this)">
          <select id="currency-${label}">
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
