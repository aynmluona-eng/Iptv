import axios from 'axios';

// To use this, users need an API key from https://www.api-football.com/
const API_KEY = (import.meta as any).env?.VITE_SPORTS_API_KEY || '104f71500dcf15b2ab1276dc7ecfbf0a';
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

  const [fixtureDetails] = await Promise.all([
     axios.get(`${BASE_URL}/fixtures`, {
        headers: getHeaders(),
        params: { id: fixtureId }
     })
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

export const getStandings = async (leagueId: number, season: number) => {
  if (!hasSportsApiConfigured()) throw new Error("API_KEY_MISSING");

  const response = await axios.get(`${BASE_URL}/standings`, {
    headers: getHeaders(),
    params: { league: leagueId, season: season }
  });

  return response.data?.response[0]?.league?.standings[0] || [];
};

export const getTopScorers = async (leagueId: number, season: number) => {
  if (!hasSportsApiConfigured()) throw new Error("API_KEY_MISSING");

  const response = await axios.get(`${BASE_URL}/players/topscorers`, {
    headers: getHeaders(),
    params: { league: leagueId, season: season }
  });

  return response.data?.response || [];
};
