import express from "express";
import axios from "axios";
import https from "https";
import http from "http";
import { createProxyMiddleware } from "http-proxy-middleware";

// Create persistent keep-alive agents to maximize parallel segment fetching and reuse TCP connections
const httpAgent = new http.Agent({ keepAlive: true, maxSockets: 100, keepAliveMsecs: 10000 });
const httpsAgent = new https.Agent({ keepAlive: true, maxSockets: 100, rejectUnauthorized: false, keepAliveMsecs: 10000 });

const app = express();

// Video streaming endpoint using direct piping
app.all("/api/stream", async (req, res) => {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, POST, OPTIONS, PUT, DELETE');
    res.setHeader('Access-Control-Allow-Headers', '*');
    return res.status(200).end();
  }

  const targetUrl = req.query.url as string;
  
  if (!targetUrl) {
    return res.status(400).send("Missing target URL");
  }

  console.log(`[Stream Proxy] Requesting: ${targetUrl}`);

  try {
    const isHttps = targetUrl.startsWith('https://');
    
    // Distinguish text playlists from binary streams based on URL extension
    const isM3u8Like = targetUrl.toLowerCase().includes('m3u8');

    if (!isM3u8Like) {
      // Use native Node.js http/https for RAW binary video streams (MP4, MKV, TS)
      const streamReqModule = isHttps ? https : http;
      
      const reqHeaders = { ...req.headers };
      delete reqHeaders['host'];
      delete reqHeaders['connection'];
      delete reqHeaders['origin'];
      delete reqHeaders['referer'];
      reqHeaders['User-Agent'] = req.headers['user-agent'] || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

      const options = {
          method: req.method,
          headers: reqHeaders,
          agent: isHttps ? httpsAgent : httpAgent
      };

      const proxyReq = streamReqModule.request(targetUrl, options, (proxyRes: any) => {
          // Manual redirect handling for native http
          if (proxyRes.statusCode >= 300 && proxyRes.statusCode < 400 && proxyRes.headers.location) {
              let location = proxyRes.headers.location;
              if (!location.startsWith('http')) {
                  location = new URL(location, targetUrl).href;
              }
              res.setHeader('Access-Control-Allow-Origin', '*');
              res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
              res.setHeader('Access-Control-Allow-Headers', '*');
              res.redirect(proxyRes.statusCode, `/api/stream?url=${encodeURIComponent(location)}`);
              return;
          }

          // Check if it's accidentally an m3u8 response
          const ct = (proxyRes.headers['content-type'] || '').toLowerCase();
          if (ct.includes('mpegurl') || ct.includes('m3u8')) {
             // Let it pipe, but it might break if it contains unproxied relative URLs inside.
             // We'll rely on the client extensions to be correct.
          }

          res.status(proxyRes.statusCode || 200);
          
          const ignoreHeaders = ['connection', 'keep-alive', 'transfer-encoding', 'strict-transport-security'];
          Object.entries(proxyRes.headers).forEach(([key, value]) => {
              if (value && !ignoreHeaders.includes(key.toLowerCase())) {
                 try {
                     res.setHeader(key, value as string | string[]);
                 } catch (e) {}
              }
          });
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
          res.setHeader('Access-Control-Allow-Headers', '*');
          
          proxyRes.pipe(res);
          
          req.on('close', () => {
             proxyRes.destroy();
          });
      });
      
      proxyReq.on('error', (err: any) => {
          console.error(`[Stream Proxy] Stream Error:`, err.message);
          if (!res.headersSent) res.sendStatus(500);
      });
      
      if (req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS') {
         proxyReq.end();
      } else {
         req.pipe(proxyReq);
      }
      return;
    }

    // For M3U8, we use axios to buffer and rewrite the playlist
    const requestConfig: any = {
      method: "GET",
      url: targetUrl,
      headers: {
        "User-Agent": req.headers['user-agent'] || "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Referer": new URL(targetUrl).origin,
        "Origin": new URL(targetUrl).origin,
      },
      responseType: "arraybuffer", // Use arraybuffer instead of stream for parsing text
      decompress: true,
      maxRedirects: 0, 
      timeout: 30000, 
      validateStatus: (status: number) => status < 500,
      httpAgent: httpAgent,
      httpsAgent: isHttps ? httpsAgent : undefined,
    };

    const response = await axios(requestConfig);

    // Manual redirect handling for M3U8
    if (response.status >= 300 && response.status < 400 && response.headers.location) {
        let location = response.headers.location;
        if (!location.startsWith('http')) {
            location = new URL(location, targetUrl).href;
        }
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', '*');
        res.redirect(`/api/stream?url=${encodeURIComponent(location)}`);
        return;
    }

    const m3u8Content = Buffer.from(response.data).toString('utf-8');
    const lines = m3u8Content.split('\n');
    const baseUrl = targetUrl.substring(0, targetUrl.lastIndexOf('/') + 1);

    const rewrittenLines = lines.map((line: string) => {
        const trimLine = line.trim();
        if (trimLine && !trimLine.startsWith('#')) {
            let absoluteUri;
            if (trimLine.startsWith('http')) absoluteUri = trimLine;
            else if (trimLine.startsWith('/')) absoluteUri = new URL(targetUrl).origin + trimLine;
            else absoluteUri = baseUrl + trimLine;
            return `/api/stream?url=${encodeURIComponent(absoluteUri)}`;
        }
        if (trimLine.startsWith('#EXT-X-KEY') && trimLine.includes('URI=')) {
            return line.replace(/URI="([^"]+)"/, (match, uri) => {
                let absoluteUri;
                if (uri.startsWith('http')) absoluteUri = uri;
                else if (uri.startsWith('/')) absoluteUri = new URL(targetUrl).origin + uri;
                else absoluteUri = baseUrl + uri;
                return `URI="/api/stream?url=${encodeURIComponent(absoluteUri)}"`;
            });
        }
        return line;
    });

    res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', '*');
    res.send(rewrittenLines.join('\n'));
    
  } catch (error: any) {
    console.error(`[Stream Proxy] Error fetching stream (${targetUrl}):`, error.message);
    if (!res.headersSent) {
      res.status(error.response?.status || 500).send("Stream error: " + error.message);
    }
  }
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.all("/api/proxy", async (req, res) => {
  try {
    const { targetUrl, ...params } = req.method === "POST" ? req.body : req.query;

    if (!targetUrl) {
      return res.status(400).json({ error: "targetUrl is required" });
    }

    const isLogin = !params.action;

    const requestConfig: any = {
      method: req.method === "POST" ? "POST" : "GET",
      url: targetUrl as string,
      params: req.method === "GET" ? params : undefined,
      data: req.method === "POST" ? params : undefined,
      headers: {
        "User-Agent": req.headers['user-agent'] || "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "*/*",
      },
      responseType: "stream", 
      decompress: false, // Let the browser handle decompression, streaming raw chunks
      httpAgent: httpAgent,
      httpsAgent: httpsAgent,
      validateStatus: () => true, // Don't throw on HTTP error statuses
      maxRedirects: 5,
      timeout: isLogin ? 60000 : 120000,
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
    };

    let response;
    try {
      response = await axios(requestConfig);
    } catch (initialError: any) {
      const isSslError = initialError.code === 'EPROTO' || 
                         initialError.message?.includes('SSL routines') || 
                         initialError.message?.includes('packet length too long');
                         
      if (isSslError && (targetUrl as string).startsWith('https://')) {
        const fallbackUrl = (targetUrl as string).replace('https://', 'http://');
        requestConfig.url = fallbackUrl;
        response = await axios(requestConfig);
      } else {
        throw initialError;
      }
    }

    // Proxy headers back to the client
    if (response && response.headers) {
      Object.entries(response.headers).forEach(([key, val]) => {
        const lowerKey = key.toLowerCase();
        if (['transfer-encoding', 'connection', 'keep-alive', 'content-length'].includes(lowerKey)) return;
        try {
          res.setHeader(key, val as string | string[]);
        } catch (e) {
          // ignore
        }
      });
    }

    res.status(response.status);
    response.data.pipe(res);
    
    req.on('close', () => {
       if (response.data && typeof response.data.destroy === 'function') {
           response.data.destroy();
       }
    });    
  } catch (error: any) {
    if (!res.headersSent) {
        const isTimeout = error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT' || error.message.toLowerCase().includes('timeout');
        res.status(isTimeout ? 504 : error.response?.status || 500).json({
          error: isTimeout ? "Gateway Timeout: The server took too long to respond." : "Failed to fetch from target URL",
          details: error.message,
          code: error.code
        });
    }
  }
});

export default app;
