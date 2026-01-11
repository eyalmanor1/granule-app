VSA — Visual System Autopilot (PWA)

FILES
- index.html              Install screen (English) + file-transfer animation + REAL install prompt
- app.html                Your app (copied from ms9.html)
- manifest.webmanifest    PWA manifest (start_url -> app.html)
- sw.js                   Service worker (offline cache)
- icon-192.png / icon-512.png / apple-touch-icon.png

DEPLOY
- Must be served over HTTPS (GitHub Pages is OK) or localhost.
- Open /index.html and click Install.
- Android/Desktop: real install requires the official browser prompt.
- iOS: manual install (Safari -> Share -> Add to Home Screen).

POST-INSTALL
- On 'appinstalled' we show: Installed + Continue + Close tab (close may be blocked).
- We also auto-navigate to app.html after ~1.2s for a smooth flow.
