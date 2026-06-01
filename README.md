# Hospital Frontend

A React + Vite frontend for the Hospital Management System.

## Features

- User authentication with JWT access/refresh tokens
- Role-based navigation and admin access control
- Patients module: list, search, create, edit, detail
- Medicines module: list, search, category filter, create, edit
- Invoices module: lookup, detail view, payment flow
- Users module: admin-only user management, activation, password reset
- Audit logs module: admin-only audit history with filters and export
- Global error handling and toast notifications
- Responsive layout with sidebar, topbar, and mobile navigation

## Tech stack

- React 18
- Vite
- Tailwind CSS
- Axios
- React Router v6
- lucide-react icons

## Getting started

1. Install dependencies

```bash
npm install
```

2. Create an environment file

```bash
cp .env.example .env
```

3. Run the app

```bash
npm run dev
```

4. Open the frontend

- `http://localhost:4173`

## API backend

This frontend expects the backend to run at:

- `http://localhost:8080`

Make sure the backend is started separately and accessible from the frontend.

## Available scripts

- `npm run dev` - start Vite development server
- `npm run build` - build production bundle
- `npm run preview` - preview production build locally

## Project structure

- `src/api` - Axios API service modules
- `src/auth` - authentication context and API
- `src/components` - reusable UI components
- `src/layouts` - app shell, sidebar, topbar
- `src/pages` - page views for each module
- `src/routes` - application routing and guards
- `src/utils` - helper functions

## Notes

- Authentication uses `accessToken` and `refreshToken` stored in `localStorage`
- Admin-only pages are protected via role guard
- Error responses from backend are displayed through toast notifications

