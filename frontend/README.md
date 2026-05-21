## AEGIS Frontend

Next.js frontend for the AEGIS platform.

## Setup

1) Install dependencies

```bash
pnpm install
```

2) Configure environment

Create a `.env.local` file in this folder and set the API URL:

```
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
```

3) Start the dev server

```bash
pnpm dev
```

Open http://localhost:3000 in your browser.

## Common Scripts

```bash
# Start development server
pnpm dev

# Create production build
pnpm build

# Run production server
pnpm start

# Lint
pnpm lint
```

## Project Structure

- `src/app` - App Router pages and layouts
- `src/components` - Reusable UI components
- `src/lib` - Client helpers and validation
- `public` - Static assets

## Notes

- The frontend expects the backend API to be running at `NEXT_PUBLIC_API_URL`.
- Update the environment value if your backend runs on a different host or port.
