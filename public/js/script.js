
document.getElementById('flight-search-form').addEventListener('submit', async (e) => {
  e.preventDefault();

  const origin = document.getElementById('departure').value.trim();
  const destination = document.getElementById('arrival').value.trim();
  const departureDate = document.getElementById('date-departure').value;
  const returnDate = document.getElementById('date-returning').value;
  const oneWay = document.getElementById('one-way').checked;


// Autocomplete departure and arrival

function attachAutocomplete(inputId) {
  const inputEl = document.getElementById(inputId);
  const suggestions = document.createElement('div');
  suggestions.classList.add('suggestions');
  inputEl.parentNode.style.position = "relative"; // make container relative
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
          inputEl.value = loc.iataCode; // insert IATA code
          suggestions.innerHTML = "";
        };
        suggestions.appendChild(item);
      });
    } catch (err) {
      console.error("Autocomplete error:", err);
    }
  });

  // Hide suggestions if user clicks outside
  document.addEventListener('click', (e) => {
    if (!inputEl.parentNode.contains(e.target)) {
      suggestions.innerHTML = "";
    }
  });
}

  // Attach to both inputs
  attachAutocomplete('departure');
  attachAutocomplete('arrival');

  // end of autocomplete code

  try {
    document.getElementById('loader').style.display = 'block';

    const response = await fetch('/search-flights', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ origin, destination, departureDate, returnDate, oneWay }),
    });

    const data = await response.json();
    console.log("Response from server:", data);

    const resultsDiv = document.getElementById('results');
    resultsDiv.innerHTML = ""; // Clear old results

    if (data.error) {
      resultsDiv.innerHTML = `<p style="color:red;">Error: ${data.error}</p>`;
      return;
      document.getElementById('loader').style.display = 'none';

    }

    if (!data.offers || data.offers.length === 0) {
      resultsDiv.innerHTML = `<p>No flights found.</p>`;
      return;
    }

    // Helper to format ISO time
    function formatTime(isoString) {
      const date = new Date(isoString);
      return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
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
  const domain = airlineDomains[airlineCode]; // keep uppercase
  const logoUrl = domain ? `/logo/${domain}` : null;

  html += `
    <div class="flight-segment">
      ${logoUrl ? `<img src="${logoUrl}" alt="${airlineCode} logo" class="airline-logo" onerror="this.style.display='none';" />` : ''}
      <p><strong>${airlineCode} ${segment.flightNumber}</strong></p>
      <p>${segment.departureAirport} → ${segment.arrivalAirport}</p>
      <p><strong>Duration:</strong> ${formatDuration(offer.duration)}</p>
      <p><strong>Segment Duration:</strong> ${formatDuration(segment.duration)}</p>
    </div>
  `;
});


      flight.innerHTML = html;
      resultsDiv.appendChild(flight);
      document.getElementById('loader').style.display = 'none';
    });

  } catch (err) {
    document.getElementById('loader').style.display = 'none';
    console.error("Fetch error:", err);
    document.getElementById('results').innerHTML = `<p style="color:red;">Error fetching flights. Check console.</p>`;
  }
});

function formatDuration(isoDuration) {
  const match = isoDuration.match(/PT(\d+H)?(\d+M)?/);
  const hours = match[1] ? match[1].replace('H', '') : '0';
  const minutes = match[2] ? match[2].replace('M', '') : '0';
  return `${hours}h ${minutes}m`;
}

const airlineDomains = {
  AA: "americanairlines.com",
  DL: "delta.com",
  UA: "united.com",
  LA: "latam.com",
  G3: "voeGOL.com.br",
  AD: "azul.com.br",
  AF: "airfrance.com",
  BA: "britishairways.com",
  LH: "lufthansa.com",
  EK: "emirates.com",
  QR: "qatarairways.com",
  CM: "copaair.com",
  TK: "thy.com",
  IB: "iberia.com",
  KL: "klm.com",
  AC: "aircanada.com",
  QF: "qantas.com",
  NH: "ana.co.jp",
  JL: "jal.com",
  ET: "ethiopianairlines.com",
  F9: "frontierairlines.com",
  WN: "southwest.com",
  AS: "alaskaair.com",
  B6: "jetblue.com",
  AC: "aircanada.com",
  NZ: "airnewzealand.com",
  CX: "cathaypacific.com",
  UX: "airnostrum.com",
  VY: "vueling.com",
  TP: "tap.pt",
  VS: "virginatlantic.com",
  SN: "brusselsairlines.com",
  OS: "austrian.com",
};