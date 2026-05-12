import axios from 'axios';

// To use this, users need an API key from https://www.api-football.com/
const API_KEY = import.meta.env.VITE_SPORTS_API_KEY;
const API_HOST = 'v3.football.api-sports.io';
const BASE_URL = `https://${API_HOST}`;

const getHeaders = () => {
  return {
    'x-rapidapi-host': API_HOST,
    'x-rapidapi-key': API_KEY,
  };
};

export const hasSportsApiConfigured = () => {
  return !!API_KEY && API_KEY.length > 5;
};

// Get today's fixtures
export const getTodaysFixtures = async (dateStr: string) => {
  if (!hasSportsApiConfigured()) throw new Error("API_KEY_MISSING");
  
  const response = await axios.get(`${BASE_URL}/fixtures`, {
    headers: getHeaders(),
    params: {
      date: dateStr,
      timezone: 'Asia/Riyadh' // Adjust based on user's region
    }
  });

  return response.data?.response || [];
};

// Get fixture details (lineups, stats, h2h, events)
export const getFixtureDetails = async (fixtureId: number) => {
  if (!hasSportsApiConfigured()) throw new Error("API_KEY_MISSING");

  const [fixtureDetails, h2hDetails] = await Promise.all([
     axios.get(`${BASE_URL}/fixtures`, {
        headers: getHeaders(),
        params: { id: fixtureId }
     }),
     // H2H needs teams. We will fetch it dynamically but for simplicity let's stick to fixture details 
     // which often includes events, lineups, statistics if we use the endpoints
     // Wait, the /fixtures endpoint by ID returns events, lineups, and statistics!
  ]);

  return fixtureDetails.data?.response?.[0];
};

export const getH2H = async (h2h: string) => {
  if (!hasSportsApiConfigured()) throw new Error("API_KEY_MISSING");
  
  const response = await axios.get(`${BASE_URL}/fixtures/headtohead`, {
    headers: getHeaders(),
    params: { h2h } // e.g., "team1Id-team2Id"
  });

  return response.data?.response || [];
};
