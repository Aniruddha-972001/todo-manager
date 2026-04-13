# Mobile App

This Expo app is a React Native client for the existing Todo Manager backend.

## Run

```bash
cd mobile
npm start
```

Then open it in:

- iOS Simulator
- Android Emulator
- Expo Go on a physical device

## API Base URL

Set `EXPO_PUBLIC_API_BASE_URL` before starting the app.

Examples:

- iOS simulator: `http://localhost:3000`
- Android emulator: `http://10.0.2.2:3000`
- Physical device: `http://YOUR_COMPUTER_LAN_IP:3000`

Example:

```bash
EXPO_PUBLIC_API_BASE_URL=http://10.0.2.2:3000 npm start
```

The current mobile auth flow keeps the access token in memory only. It does not yet persist tokens across a full app restart, and it does not use the browser-style refresh-cookie flow from the web client.
