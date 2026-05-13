# SPARTAN-G Mobile

Flutter app for the SPARTAN-G student and facilitator portals.

## Before you run it

1. Start MySQL in XAMPP.
2. Start the backend and confirm `http://localhost:3001/api/health` returns success.
3. If you are testing on a physical Android phone, keep the laptop and phone on the same Wi-Fi network.

## Run on Android

```bash
cd mobile
flutter pub get
flutter run -d <device-id>
```

The app tries multiple local host IP candidates for the backend and facilitator portal, but if your laptop IP changes you should rebuild the app so those candidates refresh.
