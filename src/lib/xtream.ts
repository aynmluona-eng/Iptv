import axios from 'axios';
import { Capacitor, CapacitorHttp } from '@capacitor/core';

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
    username: creds.username,
    password: creds.password,
    ...extraParams
  };
  
  if (action) {
    params.action = action;
  }
  
  let isNative = false;
  let isPackaged = false;
  
  if (typeof window !== 'undefined') {
      if (
        window.location.protocol === 'file:' || 
        window.location.protocol === 'tauri:' || 
        window.location.protocol === 'app:' || 
        window.location.protocol === 'capacitor:' || 
        (window.location.hostname === 'localhost' && window.location.port !== '3000' && window.location.port !== '')
      ) {
        isPackaged = true;
      }
      try {
        isNative = Capacitor.isNativePlatform() || !!(window as any).Capacitor?.isNative;
      } catch (e) {}
  }

  let data: any = null;

  if (isNative || isPackaged) {
    // 1. Native or Packaged (Android/iOS/Electron) - Try CapacitorHttp first, then fallback to fetch
    const queryString = new URLSearchParams(params as Record<string, string>).toString();
    const directUrl = `${targetUrl}?${queryString}`;
    
    let retries = 3;
    let lastError: any = null;
    let nativeSuccess = false;
    
    while (retries > 0) {
      try {
        const response = await CapacitorHttp.get({
          url: directUrl,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
            'Accept': '*/*, application/json, text/plain'
          },
          connectTimeout: 15000,
          readTimeout: 15000
        });

        if (response.status === 200 || response.status === 201) {
          data = response.data;
          if (typeof data === 'string') { try { data = JSON.parse(data); } catch (e) {} }
          nativeSuccess = true;
          break;
        } else {
          throw new Error(`Capacitor HTTP Error ${response.status}: ${JSON.stringify(response.data)}`);
        }
      } catch (nativeErr: any) {
        lastError = nativeErr;
        retries--;
        if (retries === 0) {
          console.warn(`Capacitor HTTP failed completely:`, nativeErr);
          break;
        }
        await new Promise((resolve) => setTimeout(resolve, 1500));
      }
    }

    if (!nativeSuccess) {
       // Fallback to fetch if CapacitorHttp failing but we are packaged
       try {
         const fetchRes = await fetch(directUrl);
         const textResponse = await fetchRes.text();
         if (fetchRes.ok) {
            data = textResponse;
            try { data = JSON.parse(textResponse); } catch(e){}
         } else {
            throw new Error(`HTTP ${fetchRes.status}`);
         }
       } catch (fallbackErr: any) {
         throw new Error(`مشكلة في الاتصال بالموزع: ${fallbackErr.message || fallbackErr} | مسار Capacitor: ${lastError?.message || 'فشل'}`);
       }
    }

  } else {
    // 2. We are on WEB (AI Studio). Try AI Studio Backend Proxy
    let proxyResponse;
    const proxyParams = { ...params, targetUrl };
    try {
      proxyResponse = await axios.get('/api/proxy', { params: proxyParams });
      data = proxyResponse.data;
    } catch (err: any) {
      proxyResponse = { data: null, isError: true, error: err };
    }

    if (typeof data === 'string') {
      try { data = JSON.parse(data); } catch (e) {}
    }

    // 3. Fallback to direct fetch if proxy fails or returns HTML (SPA fallback)
    if (proxyResponse?.isError || (typeof data === 'string' && data.toLowerCase().includes('<!doctype html>'))) {
      const queryString = new URLSearchParams(params as Record<string, string>).toString();
      const directUrl = `${targetUrl}?${queryString}`;
      
      try {
        const fetchRes = await fetch(directUrl);
        const textResponse = await fetchRes.text();
        
        if (fetchRes.ok) {
           data = textResponse;
           try { data = JSON.parse(textResponse); } catch (e) {}
        } else {
           throw new Error(`HTTP Error ${fetchRes.status}`);
        }
      } catch (directErr: any) {
        throw new Error(`Fallback Web Fetch: ${directErr.message || directErr}`);
      }
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
