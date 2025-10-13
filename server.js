require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

// 👉 Serve static files (frontend)
app.use(express.static(path.join(__dirname, 'public')));

const AMADEUS_API = 'https://test.api.amadeus.com';

// ===========================
// 🔐 Amadeus Authentication
// ===========================
let accessToken = null;
let tokenExpiresAt = null;

async function authenticate() {
  console.log("🔑 Requesting new Amadeus token...");
  const response = await axios.post(`${AMADEUS_API}/v1/security/oauth2/token`,
    new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: process.env.AMADEUS_CLIENT_ID,
      client_secret: process.env.AMADEUS_CLIENT_SECRET,
    }),
    { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
  );

  accessToken = response.data.access_token;
  tokenExpiresAt = Date.now() + (response.data.expires_in * 1000); // in ms
  console.log("✅ Amadeus token acquired");
}

async function getAccessToken() {
  if (!accessToken || Date.now() >= tokenExpiresAt) {
    await authenticate();
  }
  return accessToken;
}

// ===========================
// ✈️ Flight Search Endpoint
// ===========================
app.post('/search-flights', async (req, res) => {
  try {
    console.log("📩 Flight search request:", req.body);

    const token = await getAccessToken();

    const { origin, destination, departureDate, returnDate, oneWay } = req.body;

    const response = await axios.get(`${AMADEUS_API}/v2/shopping/flight-offers`, {
      headers: { Authorization: `Bearer ${token}` },
      params: {
        originLocationCode: origin,
        destinationLocationCode: destination,
        departureDate,
        ...(oneWay ? {} : { returnDate }),
        adults: 1,
        max: 10,
        currencyCode: 'USD'
      },
    });

    console.log("✅ Amadeus response received");

    const offers = response.data.data.map(offer => {
      const itinerary = offer.itineraries[0];
      const segments = itinerary.segments;

      const flights = segments.map(segment => ({
        airline: segment.carrierCode,
        flightNumber: segment.number,
        departureAirport: segment.departure.iataCode,
        departureTime: segment.departure.at,
        arrivalAirport: segment.arrival.iataCode,
        arrivalTime: segment.arrival.at,
        duration: segment.duration,
      }));

      return {
        price: offer.price.total,
        currency: offer.price.currency,
        duration: itinerary.duration,
        stops: segments.length - 1,
        flights,
      };
    });

    res.json({ offers });
  } catch (error) {
    console.error("❌ Error in /search-flights:", error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to fetch flight offers' });
  }
});

// ===========================
// 🖼 Airline Logo Proxy
// ===========================
app.get('/logo/:domain', async (req, res) => {
  const domain = req.params.domain;
  const token = process.env.LOGO_DEV_KEY;
  const logoUrl = `https://api.logo.dev/domains/${domain}`;


  try {
    const response = await axios.get(logoUrl, {
      responseType: 'arraybuffer',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'image/png'
      }
    });

    res.set('Content-Type', 'image/png');
    res.send(response.data);
  } catch (error) {
    console.error(`❌ Error fetching logo for ${domain}:`, error.response?.status, error.response?.data || error.message);
    res.status(404).send('Logo not available');
  }
});


// ===========================
// 🌍 Autocomplete Endpoint
// ===========================
app.get('/autocomplete', async (req, res) => {
  try {
    const token = await getAccessToken();

    const keyword = req.query.keyword;
    if (!keyword) return res.status(400).json({ error: "Missing keyword" });

    const response = await axios.get(`${AMADEUS_API}/v1/reference-data/locations`, {
      headers: { Authorization: `Bearer ${token}` },
      params: {
        subType: 'AIRPORT,CITY',
        keyword,
        'page[limit]': 10
      }
    });

    res.json(response.data);
  } catch (error) {
    console.error("❌ Error in /autocomplete:", error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to fetch airport suggestions' });
  }
});

// ===========================
// 🏠 Root route
// ===========================
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 🚀 Start Server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
