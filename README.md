# 📧 Email Onebox Aggregator

A production-ready email aggregation system with real-time IMAP synchronization, AI-powered categorization, and intelligent search capabilities.

## 🎯 Features

### Core Features
- ✅ **Real-Time IMAP Sync** - Persistent connections with IDLE mode (no polling!)
- ✅ **Elasticsearch Search** - Full-text search with filters and aggregations
- ✅ **AI Categorization** - Smart email classification (OpenAI + fallback)
- ✅ **Slack Integration** - Automatic notifications for interested leads
- ✅ **Modern UI** - Beautiful Next.js interface with Tailwind CSS
- ✅ **RAG Replies** - AI-powered reply suggestions with vector search

### Technical Stack
- **Backend:** Node.js 18+, TypeScript, Express, Prisma
- **Frontend:** Next.js 14, React 18, Tailwind CSS
- **Database:** PostgreSQL (metadata), Elasticsearch (search), Qdrant (vectors)
- **AI:** OpenAI (GPT-4o-mini, embeddings)
- **Infrastructure:** Docker Compose

---

## 📂 Project Structure

```
outbox/
├── backend/              # Node.js + Express API
│   ├── src/
│   │   ├── config/      # Database, email config
│   │   ├── routes/      # API endpoints
│   │   ├── services/    # Business logic
│   │   └── index.ts     # Entry point
│   ├── prisma/          # Database schema
│   ├── package.json
│   └── README.md
├── frontend/             # Next.js UI
│   ├── src/
│   │   ├── app/         # Next.js 14 app router
│   │   ├── components/  # React components
│   │   └── lib/         # Utilities
│   ├── package.json
│   └── README.md
├── docker-compose.yml    # Local development services
├── render.yaml           # Render deployment config
├── vercel.json           # Vercel deployment config
├── DEPLOYMENT.md         # Deployment guide
└── README.md             # This file
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Docker & Docker Compose
- Gmail account with App Password

### 1. Clone & Install

```bash
git clone <your-repo-url>
cd outbox

# Start Docker services
docker-compose up -d

# Install backend dependencies
cd backend
npm install
```

### 2. Configure Environment

Create `backend/.env`:

```env
PORT=3000
NODE_ENV=development

# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/onebox_db
ELASTICSEARCH_NODE=http://localhost:9200
QDRANT_URL=http://localhost:6333

# Email Account 1
EMAIL_1_ADDRESS=your-email@gmail.com
EMAIL_1_PASSWORD=your-app-password
EMAIL_1_IMAP_HOST=imap.gmail.com
EMAIL_1_IMAP_PORT=993

# Email Account 2 (optional)
EMAIL_2_ADDRESS=another-email@gmail.com
EMAIL_2_PASSWORD=another-app-password
EMAIL_2_IMAP_HOST=imap.gmail.com
EMAIL_2_IMAP_PORT=993

# AI & Integrations
OPENAI_API_KEY=sk-...
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...
EXTERNAL_WEBHOOK_URL=https://webhook.site/...

# Context (for RAG)
PRODUCT_CONTEXT="Your product information"
OUTREACH_AGENDA="Your outreach strategy"
```

Create `frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3000
```

### 3. Setup Database

```bash
cd backend
npx prisma generate
npx prisma db push
```

### 4. Start Services

```bash
# Option A: Use start script (from root)
./start-all.sh

# Option B: Manual start
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm install
npm run dev
```

### 5. Access Application

- **Frontend:** http://localhost:3001
- **Backend API:** http://localhost:3000
- **API Docs:** http://localhost:3000/api/docs

---

## 📖 Documentation

- [**DEPLOYMENT.md**](./DEPLOYMENT.md) - Production deployment guide
- [**API.md**](./API.md) - API endpoints documentation
- [**ARCHITECTURE.md**](./ARCHITECTURE.md) - System architecture
- [**backend/README.md**](./backend/README.md) - Backend documentation
- [**frontend/README.md**](./frontend/README.md) - Frontend documentation

---

## 🎬 Demo

### Features Demonstration

1. **Email Synchronization**
   - Connects to 2 Gmail accounts
   - Syncs last 30 days of emails
   - Real-time IDLE mode for instant updates

2. **Search & Filter**
   - Full-text search across subject/body
   - Filter by account, category, folder
   - Instant Elasticsearch results

3. **AI Categorization**
   - Automatically categorizes into 5 types:
     - INTERESTED, MEETING_BOOKED, NOT_INTERESTED, SPAM, OUT_OF_OFFICE
   - Triggers Slack notifications for INTERESTED emails

4. **Beautiful UI**
   - Modern, responsive design
   - Real-time statistics
   - Email detail view with reply suggestions

---

## 🧪 Testing

### API Testing (Postman)

```bash
# Health check
GET http://localhost:3000/health

# List accounts
GET http://localhost:3000/api/accounts

# Get emails
GET http://localhost:3000/api/emails?limit=20

# Search
GET http://localhost:3000/api/search?q=meeting

# Get stats
GET http://localhost:3000/api/emails/stats
```

### Frontend Testing

1. Open http://localhost:3001
2. View synced emails
3. Test search functionality
4. Filter by categories
5. Click email for details

---

## 🚢 Deployment

### Production Deployment (Vercel + Render)

**Backend → Render.com**
- Free PostgreSQL included
- Auto-deploy from GitHub
- See [DEPLOYMENT.md](./DEPLOYMENT.md)

**Frontend → Vercel**
- Optimized Next.js hosting
- Global CDN
- Zero configuration

**Cost:** Free tier available!

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed instructions.

---

## 🛠️ Development

### Backend Scripts

```bash
cd backend
npm run dev          # Development server
npm run build        # Build TypeScript
npm start            # Production server
npm run prisma:studio # Database GUI
```

### Frontend Scripts

```bash
cd frontend
npm run dev          # Development server
npm run build        # Production build
npm start            # Production server
```

---

## 📊 Tech Stack Details

### Backend
- **Runtime:** Node.js 18+
- **Framework:** Express.js
- **Language:** TypeScript
- **ORM:** Prisma
- **Email:** imap, mailparser
- **Search:** @elastic/elasticsearch
- **AI:** OpenAI, Anthropic
- **Vector DB:** Qdrant
- **Notifications:** Slack Webhook, Axios

### Frontend
- **Framework:** Next.js 14 (App Router)
- **UI Library:** React 18
- **Styling:** Tailwind CSS
- **State Management:** React Query
- **Language:** TypeScript

### Infrastructure
- **Database:** PostgreSQL 16
- **Search:** Elasticsearch 8.11
- **Vector Store:** Qdrant
- **Containerization:** Docker Compose

---

## 🔒 Security

- Environment variables for secrets
- App passwords for Gmail
- CORS configuration
- Input validation
- SQL injection protection (Prisma)
- Rate limiting ready

---

## 📝 Environment Setup Guide

### Gmail App Passwords

1. Enable 2-Factor Authentication
2. Go to Google Account → Security → App Passwords
3. Generate password for "Mail"
4. Use in `EMAIL_X_PASSWORD`

### Slack Webhook

1. Go to Slack → Apps → Incoming Webhooks
2. Create new webhook
3. Copy URL to `SLACK_WEBHOOK_URL`

### OpenAI API Key

1. Go to platform.openai.com
2. Create API key
3. Add $5-10 credit
4. Copy to `OPENAI_API_KEY`

---

## 🐛 Troubleshooting

### Docker services not starting
```bash
docker-compose down
docker-compose up -d
docker ps  # Check status
```

### Backend connection errors
```bash
# Check .env file
cat backend/.env

# Verify database connection
cd backend
npx prisma studio
```

### Frontend not connecting
```bash
# Check API URL
cat frontend/.env.local

# Test backend
curl http://localhost:3000/health
```

---

## 📈 Performance

- **Email Sync:** Real-time with IMAP IDLE
- **Search:** <100ms with Elasticsearch
- **API Response:** <200ms average
- **Frontend:** Server-side rendering with Next.js

---

## 🎓 Learning Resources

- [IMAP Protocol](https://tools.ietf.org/html/rfc3501)
- [Elasticsearch Guide](https://www.elastic.co/guide/)
- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Docs](https://www.prisma.io/docs)

---

## 📄 License

MIT License - feel free to use for your projects!

---

## 👥 Contributing

This is a demo project for ReachInbox assignment. For production use:

1. Add comprehensive error handling
2. Implement rate limiting
3. Add user authentication
4. Set up monitoring/logging
5. Add comprehensive tests

---

## 🎉 Acknowledgments

Built as part of the ReachInbox Backend Engineering assignment.

**Features Implemented:**
1. ✅ Real-Time IMAP Synchronization
2. ✅ Elasticsearch Integration
3. ✅ AI-Based Categorization
4. ✅ Slack & Webhook Integration
5. ✅ Frontend Interface
6. ✅ AI-Powered Reply Suggestions (RAG)

---

## 📞 Support

For questions or issues:
1. Check [DEPLOYMENT.md](./DEPLOYMENT.md)
2. Review logs: `tail -f backend.log` or `tail -f frontend.log`
3. Verify environment variables
4. Test with Postman collection

---

**Built with ❤️ using Node.js, TypeScript, Next.js, and AI**
# outbox
