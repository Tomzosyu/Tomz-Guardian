# TOMZ GUARDIAN AI

A personal safety companion that runs in the browser. It gives you shortcuts and guidance. It does not contact emergency services, send messages by itself, or run in the background.

## Files
index.html, style.css, app.js, manifest.json, sw.js, offline.html (extra: shown by the service worker when offline), assets/icon-192.png, assets/icon-512.png. Keep them in one folder named tomz-guardian, with the icons inside assets.

## Test on Android
1. Open the folder on your phone and upload it to GitHub (below), then open the GitHub Pages link in Chrome. Voice, location and install need HTTPS, and GitHub Pages provides it.
2. Allow the microphone and location only when asked.
3. Chrome menu, then Add to Home screen, to install it.

## Deploy with GitHub Pages
1. Create a free GitHub account and a new public repository named tomz-guardian.
2. Tap Add file, then Upload files. Upload every file, including the assets folder contents.
3. Commit. Go to Settings, then Pages. Under Branch pick main and /(root), then Save.
4. After about a minute your site is at https://YOURNAME.github.io/tomz-guardian/

## Optional real Claude backend
The app works without it. To connect Claude, run a small server that keeps your API key private (an Anthropic API account may need separate paid credit). Never put the key in index.html or app.js.

```js
// server.js (Node 18+). Set ANTHROPIC_API_KEY as an environment variable.
import http from 'http';
http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', 'https://YOURNAME.github.io');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.end();
  let body = ''; for await (const c of req) body += c;
  const { message } = JSON.parse(body);
  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'x-api-key': process.env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
    body: JSON.stringify({ model: 'claude-sonnet-5-5', max_tokens: 500,
      system: 'You are Tomz, a calm personal safety assistant. Never claim to contact emergency services.',
      messages: [{ role: 'user', content: message }] })
  });
  const j = await r.json();
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify({ reply: j.content?.[0]?.text ?? 'No reply.' }));
}).listen(3000);
```
Then paste the server URL (ending in /api/chat or your route) into Settings. Chat messages are sent to that server only if you set it.

## Privacy
Settings are stored in localStorage on your phone. Use Clear all local data to erase them. Your contact's phone number is stored there, so avoid using a shared phone.

## Limits
Flashlight control works only on some Android Chrome versions. Timers may pause when the phone sleeps. Voice needs a tap each time.
