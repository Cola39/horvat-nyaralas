const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxNCN0v54YmAPkFwv_Ie892IsvF80uAHt25lV56SYq4nvfEgvJLRnTANShnuIqYvgqvog/exec';
const FETCH_URL = `${SCRIPT_URL}?type=csenger`;

let csengerData = [];

// Oldal betöltésekor meghívjuk a letöltő függvényt
window.onload = () => {
  loadCsengerData();
};

// Külön függvénybe tettük az adatok lekérését, hogy bármikor újra tudjuk hívni
function loadCsengerData() {
  // Opcionális: Visszakapcsoljuk a töltőképernyőt, amíg frissít a háttérben
  document.getElementById('loading').style.display = 'block';
  document.getElementById('csengerTable').style.display = 'none';

  fetch(FETCH_URL)
    .then(res => res.json())
    .then(data => {
      csengerData = data.map(row => ({
          taska: row[0] || "bőrönd",
          kat: row[1] || "1",
          targy: row[2] || "",
          db: row[3] || "1",
          kosarban: String(row[5]).toUpperCase() === "TRUE",
          reggel: String(row[6]).toUpperCase() === "TRUE"
      }));
      
      sortAndRender();
      // Visszakapcsoljuk a táblázatot
      document.getElementById('loading').style.display = 'none';
      document.getElementById('csengerTable').style.display = 'table';
    })
    .catch(err => console.error('Fetch error:', err));
}

function sortAndRender() {
  csengerData.sort((a, b) => a.kat - b.kat);
  renderTable();
}

function renderTable() {
  const tbody = document.getElementById('tableBody');
  tbody.innerHTML = "";

  csengerData.forEach((item, index) => {
    const row = document.createElement('tr');
    if (item.bepakolva) row.className = "done-row";
    
    row.innerHTML = `
      <td>
        <select onchange="updateData(${index}, 'taska', this.value)">
          <option value="bőrönd" ${item.taska === 'bőrönd' ? 'selected' : ''}>bőrönd</option>
          <option value="nesszeszer" ${item.taska === 'nesszeszer' ? 'selected' : ''}>nesszeszer</option>
          <option value="hátizsák" ${item.taska === 'hátizsák' ? 'selected' : ''}>hátizsák</option>
        </select>
      </td>
      <td><input type="text" value="${item.kat || ''}" oninput="updateData(${index}, 'kategoria', this.value)"></td>
      <td><input type="text" value="${item.targy}" oninput="updateData(${index}, 'targy', this.value)"></td>
      <td><input type="number" value="${item.db}" oninput="updateData(${index}, 'db', this.value)"></td>
      <td style="text-align:center;">
        <input type="checkbox" ${item.bepakolva ? 'checked' : ''} onchange="toggleCheckbox(${index}, this.checked)">
      </td>
      <td style="text-align:center;">
        <input type="checkbox" ${item.reggel ? 'checked' : ''} onchange="toggleCheckbox(${index}, this.checked)">
      </td>
      <td><button class="delete-btn" onclick="deleteRow(${index})">🗑️</button></td>
    `;
    tbody.appendChild(row);
  });
}

function updateData(i, field, val) { csengerData[i][field] = val; }

function toggleCheckbox(i, isChecked) {
  csengerData[i].bepakolva = isChecked;
  renderTable();
}

function addRow() {
  csengerData.push({ taska: "bőrönd", kat: "5", targy: "egyéb", db: "1", bepakolva: false, reggel: false });
  sortAndRender();
}

function deleteRow(i) {
  csengerData.splice(i, 1);
  renderTable();
}

function saveCsengerList() {
  const btn = document.querySelector('.btn');
  const originalText = btn.innerText;
  btn.innerText = 'Mentés folyamatban...';
  btn.disabled = true;

  const formData = new URLSearchParams();
  formData.append("type", "csenger");
  formData.append("data", JSON.stringify(csengerData));

  fetch(SCRIPT_URL, { method: 'POST', body: formData })
    .then(res => {
      if (!res.ok) throw new Error();
      alert('Sikeres mentés!');
      
      // MENTÉS UTÁN: Újra lekérjük a szerverről a már frissített (kiszámolt 'kat' mezős) adatokat
      loadCsengerData(); 
    })
    .catch(() => alert('Hiba történt!'))
    .finally(() => {
      btn.innerText = originalText;
      btn.disabled = false;
    });
}