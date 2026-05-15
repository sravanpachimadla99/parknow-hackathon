# Vehicle Rental App

A full-stack vehicle rental system built with Spring Boot backend and React frontend.

## Features
- Vehicle inventory seeded with Telangana vehicle examples
- Pricing by vehicle segment (ECONOMY, COMPACT, PREMIUM)
- Simple payment simulation for booking
- H2 database persistence for vehicles and bookings
- React UI with local SVG Telangana vehicle images

## Run Backend
1. Open a terminal in `vehicle-rental-app/backend`
2. Set the Stripe secret key before starting the backend:
   - Windows PowerShell: `setx STRIPE_SECRET_KEY "sk_test_your_secret_key_here"`
   - macOS/Linux: `export STRIPE_SECRET_KEY=sk_test_your_secret_key_here`
3. Run `mvn spring-boot:run`
4. Backend will be available at `http://localhost:8080`

## Run Frontend
1. Open a terminal in `vehicle-rental-app/frontend`
2. Copy `.env.example` to `.env` and set your publishable key:
   - `VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here`
3. Run `npm install`
4. Run `npm run dev`
5. Open the local Vite URL, typically `http://localhost:5173`

## API
- `GET /api/vehicles` — list available vehicles
- `POST /api/bookings` — create a booking with payment simulation

## Notes
- The backend uses H2 database stored under `vehicle-rental-app/backend/data`
- The frontend proxy sends `/api` requests to the backend
