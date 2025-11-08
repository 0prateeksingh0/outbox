# Frontend - Email Onebox UI

Next.js 14 + React 18 + Tailwind CSS frontend for email management.

## Features
- Email list with search and filters
- Real-time statistics dashboard
- Email detail view
- AI-powered reply suggestions
- Responsive design

## Local Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

Visit http://localhost:3001

## Environment Variables

Create `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3000
```

## Deployment (Vercel)

1. Import from GitHub
2. Framework: Next.js
3. Root directory: `frontend`
4. Build command: `npm run build`
5. Add environment variable:
   - `NEXT_PUBLIC_API_URL` = your backend URL

## Tech Stack

- Next.js 14 (App Router)
- React 18
- Tailwind CSS
- React Query (data fetching)
- TypeScript

