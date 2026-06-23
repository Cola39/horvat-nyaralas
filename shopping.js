const scriptURL = 'https://script.google.com/macros/s/AKfycbxNCN0v54YmAPkFwv_Ie892IsvF80uAHt25lV56SYq4nvfEgvJLRnTANShnuIqYvgqvog/exec';

const fetchURL = scriptURL + "?type=shopping";

let shoppingData = [];

window.onload = function() {
  fetch(fetchURL)
    .then(response => response.json())
    .then(data => {
      shoppingData = data.map(row => ({
        taska: row[0] || "",
        kat: row[1] || "",
        targy: row[2] || "",
        db: row[3] || "",
        kosarban: row[4] === true || row[4] === "TRUE"
      }));
      
      shoppingData.sort((a, b) => a.kat - b.kat);
      
      document.getElementById('loading').style.display = 'none';
      document.getElementById('shoppingTable').style.display = 'table';
      renderTable();
    });
};

function renderTable() {
  const tbody = document.getElementById('tableBody');
  tbody.innerHTML = "";

  shoppingData.forEach((item, index) => {
    const isDoneClass = item.kosarban ? "done-row" : "";
    
    tbody.innerHTML += `
      <tr class="${isDoneClass}">
        <td>
          <select onchange="updateData(${index}, 'taska', this.value)">
            <option value="hűtőtáska" ${item.taska === 'hűtőtáska' ? 'selected' : ''}>hűtőtáska</option>
            <option value="vászontáska" ${item.taska === 'vászontáska' ? 'selected' : ''}>vászontáska</option>
          </select>
        </td>
        <td><input type="number" value="${item.kat}" oninput="updateData(${index}, 'kat', this.value)"></td>
        <td><input type="text" value="${item.targy}" oninput="updateData(${index}, 'targy', this.value)"></td>
        <td><input type="number" value="${item.db}" oninput="updateData(${index}, 'db', this.value)"></td>
        <td style="text-align:center;">
          <input type="checkbox" ${item.kosarban ? 'checked' : ''} onchange="toggleCheckbox(${index}, this.checked)">
        </td>
        <td><button class="delete-btn" onclick="deleteRow(${index})">🗑️</button></td>
      </tr>
    `;
  });
}

function updateData(index, field, value) {
  shoppingData[index][field] = value;
}

function toggleCheckbox(index, isChecked) {
  shoppingData[index].kosarban = isChecked;
  renderTable(); 
}

function addRow() {
  shoppingData.push({ taska: "hűtőtáska", kat: "1", targy: "", db: "1", kosarban: false });
  renderTable();
}

function deleteRow(index) {
  shoppingData.splice(index, 1);
  renderTable();
}

function saveShoppingList() {
  const button = document.querySelector('.btn');
  const originalText = button.innerText;
  button.innerText = 'Mentés...';

  const formData = new URLSearchParams();
  formData.append("type", "shopping"); 
  formData.append("data", JSON.stringify(shoppingData)); 

  fetch(scriptURL, {
    method: 'POST',
    body: formData 
  })
  .then(response => {
    if (!response.ok) throw new Error('Network error');
    alert('Lista sikeresen frissítve!');
    button.innerText = originalText;
    
    shoppingData.sort((a, b) => a.kat - b.kat);
    renderTable();
  })
  .catch(error => {
    console.error('Error!', error);
    alert('Hiba történt a mentés során.');
    button.innerText = originalText;
  });
}
