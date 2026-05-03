import express from "express";
import { createServer as createViteServer } from "vite";
import axios from "axios";
import path from "path";
import https from "https";
import { createProxyMiddleware } from "http-proxy-middleware";
import streamApiApp from "./api/index";

const apiCache = new Map<string, { data: any, timestamp: number }>();
const CACHE_TTL = 5000; // 5 seconds

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(streamApiApp);

  // Video streaming proxy endpoint
  // Format: /api/stream-proxy/{encoded_base_url}/{rest_of_path}
  // This helps us avoid CORS on the videos and .ts segments while keeping relative paths working
  app.use("/api/stream-proxy", (req, res, next) => {
    // req.url inside app.use starts with /
    // e.g. /http%3A%2F%2Fxtvip.net%3A80/aimen/secret/123.m3u8
    const parts = req.url.split('/'); 
    const encodedUrl = parts[1]; // the first segment
    
    if (!encodedUrl) {
      return res.status(400).send("Missing target URL");
    }

    let targetUrl;
    try {
      targetUrl = decodeURIComponent(encodedUrl);
    } catch (e) {
      return res.status(400).send("Invalid target URL");
    }
    
    if (targetUrl === 'api' || targetUrl.includes('/api/')) {
        return next();
    }
    
    console.log(`[Stream Proxy] Requesting: ${targetUrl}${req.url.replace(`/api/stream-proxy/${encodedUrl}`, '')}`);

    const proxy = createProxyMiddleware({
      target: targetUrl,
      changeOrigin: true,
      secure: false, // Ignore self-signed certs
      proxyTimeout: 300000,
      pathRewrite: (p, r) => {
        // Strip the encoded base URL part, leaving the rest of the path
        const prefix = `/api/stream-proxy/${encodedUrl}`;
        let rewritten = p;
        if (p.startsWith(prefix)) {
            rewritten = p.slice(prefix.length);
        } else if (p.startsWith(`/${encodedUrl}`)) { // depending on how use applies path
            rewritten = p.slice(`/${encodedUrl}`.length);
        }
        
        // Ensure it starts with /
        if (!rewritten.startsWith('/')) {
            rewritten = '/' + rewritten;
        }
        console.log(`[Stream Proxy] Rewriting path to: ${rewritten}`);
        return rewritten;
      },
      on: {
        proxyReq: (proxyReq, request, response) => {
          proxyReq.setHeader("User-Agent", "IPTVSmartersPro");
        },
        proxyRes: (proxyRes, req, res) => {
          console.log(`[Stream Proxy] Response: ${proxyRes.statusCode}`);
          proxyRes.headers['access-control-allow-origin'] = '*';
          proxyRes.headers['access-control-allow-methods'] = 'GET, OPTIONS';
          proxyRes.headers['access-control-allow-headers'] = '*';
          
          if (proxyRes.headers.location) {
             const location = proxyRes.headers.location;
             console.log(`[Stream Proxy] Redirect to: ${location}`);
             try {
                let targetUrlObj;
                if (location.startsWith('http')) {
                    targetUrlObj = new URL(location);
                } else {
                    targetUrlObj = new URL(location, targetUrl);
                }
                const newBase = `${targetUrlObj.protocol}//${targetUrlObj.host}`;
                const encodedNewBase = encodeURIComponent(newBase);
                proxyRes.headers.location = `/api/stream-proxy/${encodedNewBase}${targetUrlObj.pathname}${targetUrlObj.search}`;
             } catch(e) {
                console.error('Error rewriting location header', e);
             }
          }
        },
        error: (err, req, res) => {
          console.error("Stream Proxy Error:", err.message);
          // @ts-ignore
          res.writeHead && res.writeHead(500, { 'Content-Type': 'text/plain' });
          res.end && res.end('Proxy streaming error');
        }
      }
    });

    return proxy(req, res, next);
  });

  app.use(express.json());

  // Proxy API for Xtream Codes
  app.all("/api/proxy", async (req, res) => {
    try {
      const { targetUrl, ...params } = req.method === "POST" ? req.body : req.query;

      if (!targetUrl) {
        return res.status(400).json({ error: "targetUrl is required" });
      }

      console.log(`Proxying request to ${targetUrl}`, { method: req.method, action: params.action });

      const isLogin = !params.action;

      const requestConfig: any = {
        method: req.method === "POST" ? "POST" : "GET",
        url: targetUrl as string,
        params: req.method === "GET" ? params : undefined,
        data: req.method === "POST" ? params : undefined,
        headers: {
          "User-Agent": "IPTVSmartersPro",
          "Accept": "*/*",
        },
        responseType: "stream", 
        decompress: false, // Let the browser handle decompression, streaming raw chunks
        httpsAgent: new https.Agent({ rejectUnauthorized: false }), // Ignore self-signed certs
        validateStatus: () => true, // Don't throw on HTTP error statuses
        maxRedirects: 5,
        timeout: isLogin ? 60000 : 120000, // 60s timeout for login, 120s for bulk lists
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
      console.error("Proxy error:", error.message);
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

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
