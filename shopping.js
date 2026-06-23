const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxNCN0v54YmAPkFwv_Ie892IsvF80uAHt25lV56SYq4nvfEgvJLRnTANShnuIqYvgqvog/exec';
const FETCH_URL = `${SCRIPT_URL}?type=shopping`;

let shoppingData = [];

window.onload = () => {
  fetch(FETCH_URL)
    .then(res => res.json())
    .then(data => {
      shoppingData = data.map(row => ({
        taska: row[0] || "hűtőtáska",
        kat: row[1] || "1",
        targy: row[2] || "",
        db: row[3] || "1",
        kosarban: String(row[4]).toUpperCase() === "TRUE"
      }));
      
      sortAndRender();
      document.getElementById('loading').style.display = 'none';
      document.getElementById('shoppingTable').style.display = 'table';
    })
    .catch(err => console.error('Fetch error:', err));
};

function sortAndRender() {
  shoppingData.sort((a, b) => a.kat - b.kat);
  renderTable();
}

function renderTable() {
  const tbody = document.getElementById('tableBody');
  tbody.innerHTML = "";

  shoppingData.forEach((item, index) => {
    const row = document.createElement('tr');
    if (item.kosarban) row.className = "done-row";
    
    row.innerHTML = `
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
    `;
    tbody.appendChild(row);
  });
}

function updateData(i, field, val) { shoppingData[i][field] = val; }

function toggleCheckbox(i, isChecked) {
  shoppingData[i].kosarban = isChecked;
  renderTable();
}

function addRow() {
  shoppingData.push({ taska: "hűtőtáska", kat: "9", targy: "", db: "1", kosarban: false });
  sortAndRender();
}

function deleteRow(i) {
  shoppingData.splice(i, 1);
  renderTable();
}

function saveShoppingList() {
  const btn = document.querySelector('.btn');
  const originalText = btn.innerText;
  btn.innerText = 'Mentés...';
  btn.disabled = true;

  const formData = new URLSearchParams();
  formData.append("type", "shopping");
  formData.append("data", JSON.stringify(shoppingData));

  fetch(SCRIPT_URL, { method: 'POST', body: formData })
    .then(res => {
      if (!res.ok) throw new Error();
      alert('Sikeres mentés!');
      sortAndRender();
    })
    .catch(() => alert('Hiba történt!'))
    .finally(() => {
      btn.innerText = originalText;
      btn.disabled = false;
    });
}
