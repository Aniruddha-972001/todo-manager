# Todo Manager

A full-stack task management project with:

- an Express + TypeScript backend
- a React web app
- a React Native mobile app built with Expo
- SQLite persistence
- Swagger API docs
- unit, integration, and end-to-end tests

The project started as a backend-only app and was gradually expanded into a layered, typed full-stack workspace.

## Tech Stack

- Backend: Express, TypeScript, SQLite, JWT, bcrypt, Zod
- Web frontend: React, Vite, TypeScript
- Mobile frontend: React Native, Expo, TypeScript
- Testing: Vitest, Supertest, Playwright
- API docs: Swagger / OpenAPI

## Project Structure

```text
todoManager/
├── app.ts
├── server.ts
├── config/
├── controllers/
├── middleware/
├── models/
├── routes/
├── services/
├── utils/
├── tests/
├── client/
└── mobile/
```

### What each folder contains

- `server.ts`
  Entry point for the backend server.

- `app.ts`
  Creates and configures the Express app, middleware, routes, Swagger, static frontend serving, and global error handling.

- `config/`
  Shared config such as environment variables, auth settings, database setup, and Swagger config.

- `routes/`
  Route definitions only. These map URLs to controllers.

- `controllers/`
  Request/response handlers. Controllers validate input, call services, and send HTTP responses.

- `services/`
  Business logic. This is where auth, list, and todo workflows live.

- `models/`
  Database access layer. Models run SQL queries against SQLite.

- `middleware/`
  Shared Express middleware such as auth and global error handling.

- `utils/`
  Utility code such as Zod validation schemas and custom errors.

- `tests/`
  Unit and integration backend tests.

- `client/`
  React web frontend.

- `mobile/`
  React Native mobile frontend using Expo.

## How the App Works

At a high level, the flow is:

```text
Client (web or mobile)
-> API request
-> route
-> controller
-> service
-> model
-> SQLite
-> response
-> UI state update
```

### Backend startup flow

When you run:

```bash
npm run dev
```

or:

```bash
npm run build
npm start
```

the backend flow is:

1. `server.ts` starts the app.
2. `initializeDatabase()` runs before the server begins listening.
3. `config/database.ts` opens the SQLite database file and creates tables if needed.
4. `app.ts` sets up middleware, routes, Swagger, static frontend serving, and error handling.
5. Express starts listening on port `3000` by default.

### Web app flow

When you open the web app in the browser:

1. Express serves the built React app from `client/dist`.
2. The browser loads the React bundle.
3. `client/src/main.tsx` renders `client/src/App.tsx`.
4. React checks whether the user is already authenticated.
5. If logged out, it renders the auth screen.
6. If logged in, it fetches lists and the selected list’s todos.
7. User actions trigger API requests through `client/src/api.ts`.

### Mobile app flow

When you open the Expo app:

1. Expo starts `mobile/index.ts`.
2. Expo loads `mobile/App.tsx`.
3. `mobile/src/App.tsx` renders the mobile UI.
4. The app checks whether an access token is available in memory.
5. If logged out, it shows the auth screen.
6. If logged in, it loads lists and selected todos from the same backend API.
7. User actions trigger requests through `mobile/src/api.ts`.

## Features

### Auth

- Sign up
- Log in
- Log out
- Access token auth with JWT
- Refresh token flow for the web app

### Lists

- Create lists
- Rename lists
- Delete lists
- Fetch all lists for the signed-in user
- Fetch one list with its todos

### Todos

- Create todos
- Update todos
- Mark complete/incomplete
- Archive/restore
- Delete todos
- Due dates
- Priority levels
- Search and filter
- Completed and archived views
- Reordering

## Database

The app uses SQLite with a file-based database.

By default the database path is:

```text
./data/todo-manager.sqlite
```

Tables:

- `users`
- `lists`
- `todos`
- `refresh_tokens`

The database is initialized automatically on server startup.

## Setup

### 1. Install dependencies

From the project root:

```bash
npm install
```

For the web client:

```bash
cd client
npm install
```

For the mobile app:

```bash
cd mobile
npm install
```

### 2. Create environment variables

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Example environment variables:

```env
PORT=3000
JWT_SECRET=change-me-in-production
ACCESS_TOKEN_TTL=15m
REFRESH_TOKEN_TTL=7d
REFRESH_COOKIE_MAX_AGE_MS=604800000
DB_PATH=./data/todo-manager.sqlite
FRONTEND_ORIGIN=http://localhost:5173
EXPO_PUBLIC_API_BASE_URL=http://localhost:3000
```

## Running the Backend

### Development

```bash
npm run dev
```

This runs the TypeScript backend directly with file watching.

### Production-style

```bash
npm run build
npm start
```

This:

1. builds the backend
2. builds the React web app
3. starts Express
4. serves both the API and the built web frontend from the same server

## Running the Web App

### Development mode

Use two terminals:

Terminal 1:

```bash
npm run dev
```

Terminal 2:

```bash
npm run client:dev
```

Then open:

```text
http://localhost:5173
```

### Production-style mode

```bash
npm run build
npm start
```

Then open:

```text
http://localhost:3000
```

## Running the Mobile App

The mobile app uses Expo and talks to the same backend.

### Start the backend first

Terminal 1:

```bash
npm run dev
```

### Then start Expo

Terminal 2:

```bash
EXPO_PUBLIC_API_BASE_URL=http://YOUR_API_URL:3000 npm run mobile:dev
```

### Which API URL should you use?

- iOS simulator:
  `http://localhost:3000`

- Android emulator:
  `http://10.0.2.2:3000`

- Physical phone:
  `http://YOUR_COMPUTER_LAN_IP:3000`

Example for a physical device:

```bash
EXPO_PUBLIC_API_BASE_URL=http://192.168.1.70:3000 npm run mobile:dev
```

Then:

- open Expo Go on your phone and scan the QR code
- or run:
  - `npm run mobile:ios`
  - `npm run mobile:android`

### Important mobile note

The current mobile app uses an in-memory access token.

That means:

- login works while the app is running
- the token is not persisted across a full app restart yet

This was done temporarily to avoid a native storage integration issue. The next improvement would be to move that token into Expo SecureStore.

## Swagger API Docs

When the backend is running, Swagger is available at:

```text
http://localhost:3000/api-docs
```

Raw OpenAPI JSON:

```text
http://localhost:3000/api-docs.json
```

## Testing

### Unit + integration tests

```bash
npm test
```

### End-to-end tests

```bash
npm run e2e
```

### Headed E2E mode

```bash
npm run e2e:headed
```

## Scripts

Root scripts:

- `npm run dev`
  Start backend in development mode

- `npm run build`
  Build backend and web frontend

- `npm start`
  Start the compiled backend server

- `npm run client:dev`
  Start the React web app in dev mode

- `npm run client:build`
  Build the React web app

- `npm run mobile:dev`
  Start Expo for the mobile app

- `npm run mobile:ios`
  Open the mobile app in iOS simulator

- `npm run mobile:android`
  Open the mobile app in Android emulator

- `npm run mobile:web`
  Run the mobile app on Expo web

- `npm test`
  Run unit and integration tests

- `npm run e2e`
  Run Playwright end-to-end tests

## API Endpoints

Main backend routes:

- `POST /api/signup`
- `POST /api/login`
- `POST /api/refresh`
- `POST /api/logout`
- `GET /api/me`
- `GET /api/lists`
- `POST /api/lists`
- `GET /api/lists/:id`
- `PATCH /api/lists/:id`
- `DELETE /api/lists/:id`
- `GET /api/lists/:id/todos`
- `POST /api/lists/:id/todos`
- `POST /api/lists/:id/todos/reorder`
- `PATCH /api/todos/:todoId`
- `DELETE /api/todos/:todoId`

## Notes

- The web app uses refresh-token cookies.
- The mobile app currently uses access-token-only auth in memory.
- The backend is fully typed with TypeScript.
- Request validation uses Zod.
- Errors are handled through centralized Express error middleware.
- SQLite schema updates are applied on startup.

## Good Next Improvements

- persist mobile tokens with Expo SecureStore
- add centralized logging
- add rate limiting for auth routes
- improve mobile navigation with React Navigation
- deploy the backend and frontend
