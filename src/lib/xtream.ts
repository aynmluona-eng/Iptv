import axios from 'axios';

export interface XtreamCredentials {
  serverUrl: string;
  username: string;
  password: string;
}

export const getXtreamBaseUrl = (creds: XtreamCredentials) => {
  return creds.serverUrl.endsWith('/')
    ? creds.serverUrl.slice(0, -1)
    : creds.serverUrl;
};

const apiCache = new Map<string, { timestamp: number, data: any }>();
const CACHE_TTL = 1000 * 60 * 15; // 15 minutes aggressive caching

// We use our proxy to bypass CORS when making API calls
export const fetchXtreamApi = async (creds: XtreamCredentials, action?: string, extraParams: Record<string, string> = {}) => {
  const cacheKey = JSON.stringify({ server: creds.serverUrl, user: creds.username, action, extraParams });
  
  // Do not cache logins (no action)
  if (action) {
     const cached = apiCache.get(cacheKey);
     if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        return cached.data;
     }
  }

  const baseUrl = getXtreamBaseUrl(creds);
  const targetUrl = `${baseUrl}/player_api.php`;
  
  const params: any = {
    targetUrl,
    username: creds.username,
    password: creds.password,
    ...extraParams
  };
  
  if (action) {
    params.action = action;
  }
  
  let response;
  try {
    response = await axios.get('/api/proxy', { params });
  } catch (err: any) {
    response = { data: null, isError: true, error: err };
  }
  
  let data = response.data;
  if (typeof data === 'string') {
    try { data = JSON.parse(data); } catch (e) {}
  }

  if (response.isError || (typeof data === 'string' && data.toLowerCase().includes('<!doctype html>'))) {
    try {
      const directParams = { ...params };
      delete directParams.targetUrl;
      response = await axios.get(targetUrl, { params: directParams });
      data = response.data;
      if (typeof data === 'string') {
         try { data = JSON.parse(data); } catch (e) {}
      }
    } catch (directErr: any) {
      throw response.isError ? response.error : directErr;
    }
  }
  
  if (action && data && !data.error) {
     apiCache.set(cacheKey, { timestamp: Date.now(), data });
  }
  
  return data;
};

export const getOriginalStreamUrl = (creds: XtreamCredentials, id: string | number, type: 'live' | 'movie' | 'series' = 'live', ext: string = '') => {
  const baseUrl = getXtreamBaseUrl(creds);
  const u = encodeURIComponent(creds.username);
  const p = encodeURIComponent(creds.password);
  
  if (type === 'live') {
    if (ext === 'm3u8') return `${baseUrl}/live/${u}/${p}/${id}.m3u8`;
    return `${baseUrl}/${u}/${p}/${id}`; // Typical TS stream
  } else if (type === 'movie') {
    return `${baseUrl}/movie/${u}/${p}/${id}.${ext || 'mp4'}`;
  } else if (type === 'series') {
    return `${baseUrl}/series/${u}/${p}/${id}.${ext || 'mp4'}`;
  }
  return '';
};

export const getStreamUrl = (creds: XtreamCredentials, id: string | number, type: 'live' | 'movie' | 'series' = 'live', ext: string = 'm3u8') => {
  const originalUrl = getOriginalStreamUrl(creds, id, type, ext);
  
  // If running in a packaged desktop/mobile app context where there's no custom backend proxy running
  if (typeof window !== 'undefined' && (
      window.location.protocol === 'file:' || 
      window.location.protocol === 'tauri:' || 
      window.location.protocol === 'app:' || 
      window.location.protocol === 'capacitor:' || 
      window.location.hostname === 'localhost' && window.location.port !== '3000' && window.location.port !== '')
  ) {
     return originalUrl;
  }
  
  return `/api/stream?url=${encodeURIComponent(originalUrl)}`;
};
