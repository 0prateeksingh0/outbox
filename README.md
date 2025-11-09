# 📧 Email Onebox Aggregator

A feature-rich email aggregator with AI-powered categorization, real-time IMAP sync, and intelligent search.

## 🚀 Live Demo

- **Frontend**: https://outbox.vercel.app
- **Backend API**: https://outbox-b10k.onrender.com
- **Health Check**: https://outbox-b10k.onrender.com/health

---

## ✨ Features

- ✅ **Real-time Email Sync** - IMAP IDLE mode for instant email updates
- ✅ **Multi-Account Support** - Sync multiple Gmail accounts
- ✅ **AI Categorization** - Auto-categorize emails (Interested, Meeting Booked, Not Interested, Spam, Out of Office)
- ✅ **Smart Search** - Elasticsearch-powered full-text search
- ✅ **AI Reply Suggestions** - RAG-based intelligent reply generation
- ✅ **Slack Integration** - Notifications for important emails
- ✅ **Webhook Support** - Trigger external automation
- ✅ **Modern UI** - Clean Next.js interface with Tailwind CSS

---

## 🏗️ Tech Stack

### Backend
- **Node.js** + **TypeScript** + **Express**
- **PostgreSQL** (Prisma ORM) - Email metadata storage
- **Elasticsearch** - Full-text search and indexing
- **Qdrant** - Vector database for RAG
- **OpenAI GPT-4o-mini** - AI categorization
- **IMAP** - Real-time email synchronization

### Frontend
- **Next.js 14** + **React** + **TypeScript**
- **Tailwind CSS** - Styling
- **React Query** - Data fetching and caching

### Infrastructure
- **Docker Compose** - Local development environment
- **Render** - Backend hosting
- **Vercel** - Frontend hosting

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Docker and Docker Compose
- Gmail account with App Password

### 1. Clone Repository
```bash
git clone https://github.com/0prateeksingh0/outbox.git
cd outbox
```

### 2. Start Infrastructure
```bash
docker-compose up -d
```

This starts:
- PostgreSQL (port 5432)
- Elasticsearch (port 9200)
- Qdrant (port 6333)

### 3. Setup Backend
```bash
cd backend

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Edit .env with your credentials
# Add: DATABASE_URL, OPENAI_API_KEY, EMAIL_ACCOUNTS, SLACK_WEBHOOK_URL

# Run database migrations
npx prisma migrate dev

# Start backend
npm run dev
```

Backend runs on http://localhost:3000

### 4. Setup Frontend
```bash
cd frontend

# Install dependencies
npm install

# Create .env.local
echo "NEXT_PUBLIC_API_URL=http://localhost:3000" > .env.local

# Start frontend
npm run dev
```

Frontend runs on http://localhost:3001

---

## 🔧 Configuration

### Backend Environment Variables

Create `backend/.env`:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/onebox"

# Search & Vector DB
ELASTICSEARCH_NODE=http://localhost:9200
QDRANT_URL=http://localhost:6333

# AI
OPENAI_API_KEY=your-openai-api-key

# Notifications
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
WEBHOOK_URL=https://webhook.site/your-unique-url

# Email Accounts (JSON format)
EMAIL_ACCOUNTS=[{"email":"user@gmail.com","password":"app-password","host":"imap.gmail.com","port":993}]

# App Config
NODE_ENV=development
PORT=3000
```

### Frontend Environment Variables

Create `frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3000
```

---

## 📦 Project Structure

```
outbox/
├── backend/                # Backend API
│   ├── src/
│   │   ├── config/        # Database & email config
│   │   ├── routes/        # API routes
│   │   ├── services/      # Business logic (IMAP, AI, Search)
│   │   └── utils/         # Utilities
│   ├── prisma/            # Database schema
│   └── package.json
├── frontend/              # Frontend UI
│   ├── src/
│   │   ├── app/          # Next.js app router
│   │   ├── components/   # React components
│   │   └── lib/          # API client
│   └── package.json
├── docker-compose.yml     # Local infrastructure
├── render.yaml           # Render deployment config
└── vercel.json          # Vercel deployment config
```

---

## 🌐 Deployment

### Deploy Backend to Render

1. Push code to GitHub
2. Connect repository to Render
3. Render auto-detects `render.yaml`
4. Set environment variables
5. Deploy!

**Root Directory**: `backend`

### Deploy Frontend to Vercel

1. Connect repository to Vercel
2. Set **Root Directory** to `frontend`
3. Add environment variable: `NEXT_PUBLIC_API_URL=https://your-backend.onrender.com`
4. Deploy!

---

## 🔌 API Endpoints

### Health
- `GET /health` - Health check

### Emails
- `GET /api/emails` - List emails
- `GET /api/emails/:id` - Get email details
- `POST /api/emails/:id/reply-suggestions` - Get AI reply suggestions
- `PUT /api/emails/:id/category` - Update email category

### Accounts
- `GET /api/accounts` - List email accounts
- `POST /api/accounts` - Add email account

### Search
- `GET /api/search?q=query` - Search emails
- `GET /api/search?category=INTERESTED` - Filter by category

---

## 🧪 Testing

### Test Backend
```bash
curl http://localhost:3000/health
curl http://localhost:3000/api/emails
```

### Test Frontend
Open http://localhost:3001 in your browser

---

## 📝 Development

### Backend
```bash
cd backend
npm run dev        # Start dev server with hot reload
npm run build      # Build for production
npm start          # Start production server
```

### Frontend
```bash
cd frontend
npm run dev        # Start dev server
npm run build      # Build for production
npm start          # Start production server
```

---

## 🤝 Gmail Setup

1. Enable 2-Factor Authentication on your Google account
2. Go to https://myaccount.google.com/apppasswords
3. Generate App Password
4. Use the 16-character password in `EMAIL_ACCOUNTS` config

---

## 📊 Features Overview

### AI Email Categorization
Uses OpenAI GPT-4o-mini to categorize emails into:
- **Interested** - Shows interest, requests info
- **Meeting Booked** - Meeting confirmed
- **Not Interested** - Clear rejection
- **Spam** - Promotional/irrelevant
- **Out of Office** - Auto-reply

### Real-time Sync
- IMAP IDLE mode for instant updates
- Syncs last 30 days of emails
- Supports multiple accounts
- No polling, true push notifications

### Smart Search
- Full-text search powered by Elasticsearch
- Filter by account, folder, category
- Fast and scalable

### AI Reply Suggestions
- RAG (Retrieval-Augmented Generation)
- Context-aware responses
- Powered by Qdrant + OpenAI

---

## 🛠️ Troubleshooting

### Backend won't start
- Check Docker services are running: `docker-compose ps`
- Verify DATABASE_URL is correct
- Check logs: `npm run dev`

### Frontend can't connect to backend
- Verify NEXT_PUBLIC_API_URL is set
- Check backend is running on correct port
- Check CORS settings

### Email sync not working
- Verify Gmail App Password is correct
- Check IMAP settings (host, port)
- Review backend logs for errors

---

## 📄 License

MIT License - see LICENSE file for details

---

## 👨‍💻 Author

Built by Prateek Singh

- GitHub: [@0prateeksingh0](https://github.com/0prateeksingh0)
- Email: prateeksingh0605@gmail.com

---

## 🙏 Acknowledgments

- OpenAI for GPT API
- Elastic for search capabilities
- Render & Vercel for hosting
- Next.js & React teams

---

**⭐ Star this repo if you find it useful!**
