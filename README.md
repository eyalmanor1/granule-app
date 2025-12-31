# PWA Pack – Manor Engineering

הקבצים בתיקייה הזו עוטפים את `index.html` כ־PWA (Manifest + Service Worker) ומוסיפים מסך "התקנה" חצי־שקוף עם Checklist + Continue שמדמה תהליך Install של ~8–10 שניות.

## מה עובד (כמו Native)
- Install prompt אמיתי ב־Android/Chrome (כשזמין) דרך `beforeinstallprompt`
- Offline cache בסיסי (Service Worker)
- פתיחה במצב Standalone לאחר התקנה (icon במסך הבית)

## חשוב לדעת (מגבלות דפדפן)
- אי אפשר "לסגור את הדפדפן" בצורה פרוגרמטית, וגם אי אפשר להכריח לפתוח את האפליקציה המותקנת אחרי ההתקנה.
  אחרי התקנה – המשתמש פותח מהאייקון במסך הבית (כך זה עובד בפועל במערכות ההפעלה).

## העלאה ל־GitHub
1. צרו Repository חדש ב־GitHub.
2. העלו את *כל* התוכן של התיקייה הזו לשורש ה־repo (כולל `index.html`, `manifest.webmanifest`, `sw.js`, ותיקיית `icons/`).
3. להדגמה ב־GitHub Pages:
   - Settings → Pages
   - Source: Deploy from a branch
   - Branch: main / root
4. פתחו את ה־URL של Pages בטלפון (Chrome/Android מומלץ כדי לראות prompt אמיתי).

## התאמות
- שם האפליקציה: `manifest.webmanifest`
- צבעים/שקיפות של המסך: בתוך `index.html` (CSS תחת "PWA Install Overlay")
- משך ההדמיה: בתוך `index.html` (JS: `total = 8200 + random`)

