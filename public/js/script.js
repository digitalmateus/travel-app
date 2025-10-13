attachAutocomplete('departure');
attachAutocomplete('arrival');

const airlineDomains = {
  AA: "americanairlines.com",
  DL: "delta.com",
  UA: "united.com",
  LA: "latam.com",
  G3: "voeGOL.com.br",
  AF: "airfrance.com",
  BA: "britishairways.com",
  LH: "lufthansa.com",
  KL: "klm.com",
  EK: "emirates.com",
  QR: "qatarairways.com",
  EY: "etihad.com",
  CX: "cathaypacific.com",
  QF: "qantas.com",
  AC: "aircanada.com",
  AS: "alaskaair.com",
  B6: "jetblue.com",
  WN: "southwest.com",
  SK: "flysas.com",
  TK: "turkishairlines.com",
  AZ: "ita-airways.com",
  AI: "airindia.com",
  NH: "ana.co.jp",
  JL: "jal.co.jp",
  HU: "hnair.com",
  CA: "airchina.com",
  CZ: "csair.com",
  BR: "evaair.com",
  AV: "avianca.com",
  IB: "iberia.com",
  AM: "aeromexico.com",
  AY: "finnair.com",
  ET: "ethiopianairlines.com",
  SN: "brusselsairlines.com",
  SA: "flysaa.com",
  RJ: "rj.com",
  LY: "elal.com",
  MS: "egyptair.com",
  VN: "vietnamairlines.com",
  NZ: "airnewzealand.com",
  AT: "royalairmaroc.com",
};

const airlineNames = {
  AA: "American Airlines",
  DL: "Delta Air Lines",
  UA: "United Airlines",
  LA: "LATAM Airlines",
  G3: "Gol Linhas Aéreas",
  AF: "Air France",
  BA: "British Airways",
  LH: "Lufthansa",
  KL: "KLM Royal Dutch Airlines",
  EK: "Emirates",
  QR: "Qatar Airways",
  EY: "Etihad Airways",
  CX: "Cathay Pacific",
  QF: "Qantas",
  AC: "Air Canada",
  AS: "Alaska Airlines",
  B6: "JetBlue Airways",
  WN: "Southwest Airlines",
  SK: "Scandinavian Airlines",
  TK: "Turkish Airlines",
  AZ: "ITA Airways",
  AI: "Air India",
  NH: "All Nippon Airways",
  JL: "Japan Airlines",
  HU: "Hainan Airlines",
  CA: "Air China",
  CZ: "China Southern Airlines",
  BR: "EVA Air",
  AV: "Avianca",
  IB: "Iberia",
  AM: "Aeroméxico",
  AY: "Finnair",
  ET: "Ethiopian Airlines",
  SN: "Brussels Airlines",
  SA: "South African Airways",
  RJ: "Royal Jordanian",
  LY: "El Al Israel Airlines",
  MS: "EgyptAir",
  VN: "Vietnam Airlines",
  NZ: "Air New Zealand",
  AT: "Royal Air Maroc",
};

let lastOffers = [];

document.getElementById('flight-search-form').addEventListener('submit', async (e) => {
  e.preventDefault();

  const origin = document.getElementById('departure').value.trim();
  const destination = document.getElementById('arrival').value.trim();
  const departureDate = document.getElementById('date-departure').value;
  const returnDate = document.getElementById('date-returning').value;
  const oneWay = document.getElementById('one-way').checked;

  const resultsDiv = document.getElementById('results');
  const showSelectedBtn = document.getElementById('show-selected');
  

  try {
    document.getElementById('loader').style.display = 'block';

    const response = await fetch('/search-flights', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ origin, destination, departureDate, returnDate, oneWay }),
    });

    const data = await response.json();
    console.log("Response from server:", data);

    resultsDiv.innerHTML = "";
    lastOffers = [];

    if (data.error || !data.offers || data.offers.length === 0) {
      resultsDiv.innerHTML = data.error ? `<p style="color:red;">Error: ${data.error}</p>` : `<p>No flights found.</p>`;
      showSelectedBtn.classList.add('hidden');
      return;
    }

    // Loop through offers
    data.offers.forEach((offer, index) => {
      const flight = document.createElement('div');
      flight.classList.add('flight-card');

      const price = offer.price || "N/A";
      const currency = offer.currency || "USD";

      let html = `
        <div class="flight-header">
          <input type="checkbox" class="offer-select" value="${index}">
          <h3>OPTION ${index + 1}</h3>
        </div>
        <p><strong>Price:</strong> ${currency} ${price}</p>
        <p><strong>Duration:</strong> ${offer.duration}</p>
        <p><strong>Stops:</strong> ${offer.stops}</p>
      `;

      offer.flights.forEach(segment => {
        const airlineCode = segment.airline || segment.operating?.carrierCode;
        const domain = airlineDomains[airlineCode];
        const logoUrl = domain ? `https://img.logo.dev/${domain}?token=pk_V1ufOQZzS_K3boH6HSZOWg` : null;
        const airlineName = airlineNames[airlineCode] || airlineCode || '';

        html += `
        <div class="flight-segment">
          ${logoUrl ? `<img src="${logoUrl}" alt="${airlineCode} logo" class="airline-logo" onerror="this.style.display='none';" />` : ''}
          <p><strong>${airlineName} ${segment.flightNumber}</strong></p>
          <p>${segment.departureAirport} → ${segment.arrivalAirport}</p>
          <p><strong>Duration:</strong> ${formatDuration(offer.duration)}</p>
          <p><strong>Segment Duration:</strong> ${formatDuration(segment.duration)}</p>
        </div>
      `;
      });

      flight.innerHTML = html;
      resultsDiv.appendChild(flight);
    });

    lastOffers = data.offers;
    document.getElementById('loader').style.display = 'none';
  } catch (err) {
    console.error("Fetch error:", err);
    resultsDiv.innerHTML = `<p style="color:red;">Error fetching flights. Check console.</p>`;
    showSelectedBtn.classList.add('hidden');
    document.getElementById('loader').style.display = 'none';
  }
});

function attachAutocomplete(inputId) {
  const inputEl = document.getElementById(inputId);
  const suggestions = document.createElement('div');
  suggestions.classList.add('suggestions');
  inputEl.parentNode.style.position = "relative";
  inputEl.parentNode.appendChild(suggestions);

  inputEl.addEventListener('input', async () => {
    const query = inputEl.value.trim();
    if (query.length < 2) {
      suggestions.innerHTML = "";
      return;
    }

    try {
      const res = await fetch(`/autocomplete?keyword=${encodeURIComponent(query)}`);
      const data = await res.json();
      suggestions.innerHTML = "";
      (data.data || []).forEach(loc => {
        const item = document.createElement('div');
        item.classList.add('suggestion-item');
        item.textContent = `${loc.name} (${loc.iataCode})`;
        item.onclick = () => {
          inputEl.value = loc.iataCode;
          suggestions.innerHTML = "";
        };
        suggestions.appendChild(item);
      });
    } catch (err) {
      console.error("Autocomplete error:", err);
    }
  });

  document.addEventListener('click', (e) => {
    if (!inputEl.parentNode.contains(e.target)) suggestions.innerHTML = "";
  });
}

function formatDuration(isoDuration) {
  const match = isoDuration.match(/PT(\d+H)?(\d+M)?/);
  const hours = match && match[1] ? match[1].replace('H', '') : '0';
  const minutes = match && match[2] ? match[2].replace('M', '') : '0';
  return `${hours}h ${minutes}m`;
}

//modal with offers selected
document.getElementById('show-selected').addEventListener('click', () => {
  const checkboxes = document.querySelectorAll('.offer-select:checked');
  const selectedIndexes = Array.from(checkboxes).map(cb => parseInt(cb.value));
  const selectedOffers = selectedIndexes.map(idx => lastOffers[idx]);

  let html = '';
  selectedOffers.forEach((offer, i) => {
    html += `<div style="border-bottom:1px solid #ccc;margin-bottom:10px;padding-bottom:10px;">
      <strong>Option ${i + 1}</strong><br>
      Price: ${offer.currency} ${offer.price}<br>
      Duration: ${offer.duration}<br>
      Stops: ${offer.stops}<br>
      ${offer.flights.map(seg => {
        const airlineCode = seg.airline || seg.operating?.carrierCode;
        const airlineName = airlineNames[airlineCode] || airlineCode || '';
        return `<div>${airlineCode} ${airlineName} ${seg.flightNumber || ''}: 
          ${seg.departureAirport} → ${seg.arrivalAirport} 
          (${seg.duration})</div>`;
      }).join('')}
    </div>`;
  });

  // Perfil
  const profile = JSON.parse(localStorage.getItem('companyProfile'));
  if (profile) {
    html += `
      <div class="perfil-proposta" style="margin-top:20px;padding-top:10px;border-top:2px solid #ccc;text-align:center;">
        ${profile.logo ? `<img src="${profile.logo}" alt="Logo da empresa" style="max-width:100px;margin-bottom:10px;">` : ''}
        <p style="font-weight:bold;margin:0;">${profile.name || ''}</p>
        <p style="margin:0;">${profile.phone || ''}</p>
      </div>
    `;
  }

  document.getElementById('selectedDetails').innerHTML = html || '<em>No options selected.</em>';
  document.getElementById('selectedModal').style.display = 'block';
});

document.getElementById('closeModal').onclick = () => document.getElementById('selectedModal').style.display = 'none';
window.onclick = (event) => {
  if (event.target === document.getElementById('selectedModal')) {
    document.getElementById('selectedModal').style.display = 'none';
  }
};

// Copy para clipboard
document.getElementById('copySelected').onclick = () => {
  const text = document.getElementById('selectedDetails').innerText;
  navigator.clipboard.writeText(text).then(() => alert('Copied to clipboard!'));
};

