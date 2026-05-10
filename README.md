# SPARTAN-G

Mental Health Support System for BatStateU-TNEU.

## Services

- Backend: `backend` (Node.js, Express)
- Student portal: `student-portal` (Vite + React)
- OGC dashboard: `ogc-dashboard` (Vite + React)
- Mobile: `mobile` (Flutter)

## Starting SPARTAN-G

### Prerequisites (do these FIRST):
1. Open XAMPP Control Panel
2. Click Start next to MySQL
3. Wait for MySQL to show green

### Then start all services:
Double-click `start-all.bat`

### Or manually in order:
```bash
# Terminal 1 - Backend
cd backend
node src/server.js

# Terminal 2 - Student Portal
cd student-portal
npm run dev

# Terminal 3 - OGC Dashboard
cd ogc-dashboard
npm run dev

# Terminal 4 - Mobile (Flutter Web)
cd mobile
flutter run -d chrome
```

### Verify everything is running:
- http://localhost:3001/api/health → `{"success":true}`
- http://localhost:5173 → Student Portal
- http://localhost:5174 → OGC Dashboard

## Running locally

1. Backend

```bash
cd backend
npm install
# create DB and seed
npm run setup
# start dev server
node src/server.js
```

2. Student portal

```bash
cd student-portal
npm install
npm run dev
```

3. OGC dashboard

```bash
cd ogc-dashboard
npm install
npm run dev
```

4. Mobile (Flutter)

Install Flutter SDK and run:

```bash
cd mobile
flutter pub get
# For web (Chrome)
flutter run -d chrome
# For Android emulator
flutter run
```

Frontend dev servers proxy `/api` to `http://localhost:3001`.

## Default testing credentials

- OGC facilitator: `ogc@batstateu.edu.ph` / `OGC@2025`

## Notes

- The project uses MySQL (XAMPP) for the backend database. Ensure MySQL is running and `.env` in `backend` is configured.
- Smoke tests are available at `backend/src/scripts/smoke-test.js`.
# Project-SPARTAN-G-
SPARTAN-G — Mental Health Support System for BatStateU-TNEU Lipa Campus
