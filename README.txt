REAL PWA INSTALL BUNDLE (EN)

Files:
- index.html              Installer screen (with file-transfer animation + REAL install prompt when supported)
- app.html                Your app (copied from ms9.html)
- manifest.webmanifest    PWA manifest (start_url points to app.html)
- sw.js                   Service worker (offline cache)
- icon-192.png / icon-512.png / apple-touch-icon.png

How to use:
1) Serve over HTTPS (GitHub Pages is perfect) or localhost.
2) Open /index.html
3) Click Install (Android/Desktop shows a REAL prompt if eligible)
4) iOS: Safari → Share → Add to Home Screen

Important:
- No webpage can "force install" without the browser prompt.
- If Android installs but you don't see an icon: check the App Drawer and then Add to Home.


Post-install behavior:
- After real install (appinstalled), the installer auto-navigates to app.html after ~1.2s.
- It also shows buttons: Open VSA / Close tab (close may be blocked by browser security).
