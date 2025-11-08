# Deployment Guide

## 📦 Project Structure

```
outbox/
├── backend/              # Node.js + Express API
│   ├── src/
│   ├── prisma/
│   ├── package.json
│   └── README.md
├── frontend/             # Next.js UI
│   ├── src/
│   ├── package.json
│   └── README.md
├── docker-compose.yml    # Local development
├── render.yaml           # Render deployment
├── vercel.json           # Vercel deployment
└── README.md
```

---

## 🚀 Local Development

### Prerequisites
- Node.js 18+
- Docker & Docker Compose
- npm or yarn

### Quick Start

```bash
# Clone repository
git clone your-repo-url
cd outbox

# Start Docker services (PostgreSQL, Elasticsearch, Qdrant)
docker-compose up -d

# Start backend
cd backend
npm install
npx prisma generate
npx prisma db push
npm run dev

# Start frontend (new terminal)
cd frontend
npm install
npm run dev
```

**Access:**
- Frontend: http://localhost:3001
- Backend: http://localhost:3000

---

## ☁️ Production Deployment

### Option 1: Vercel (Frontend) + Render (Backend)

#### **Backend → Render.com**

1. **Connect Repository**
   - Go to [Render Dashboard](https://dashboard.render.com)
   - Click "New +" → "Web Service"
   - Connect your GitHub repository

2. **Configure Service**
   - Name: `email-onebox-backend`
   - Root Directory: `backend`
   - Runtime: Node
   - Build Command: `npm install && npx prisma generate && npm run build`
   - Start Command: `npm start`

3. **Add PostgreSQL Database**
   - Create new PostgreSQL database (Free tier)
   - Copy connection string

4. **Environment Variables**
   ```
   NODE_ENV=production
   PORT=3000
   DATABASE_URL=<from Render PostgreSQL>
   ELASTICSEARCH_NODE=<Elastic Cloud URL or Bonsai>
   EMAIL_1_ADDRESS=your-email@gmail.com
   EMAIL_1_PASSWORD=your-app-password
   EMAIL_1_IMAP_HOST=imap.gmail.com
   EMAIL_1_IMAP_PORT=993
   EMAIL_2_ADDRESS=...
   EMAIL_2_PASSWORD=...
   OPENAI_API_KEY=your-key
   SLACK_WEBHOOK_URL=your-webhook
   QDRANT_URL=<Qdrant Cloud URL>
   ```

5. **Deploy**
   - Click "Create Web Service"
   - Wait for deployment
   - Note your backend URL: `https://your-app.onrender.com`

#### **Frontend → Vercel**

1. **Import Project**
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Click "Add New..." → "Project"
   - Import your GitHub repository

2. **Configure**
   - Framework Preset: Next.js
   - Root Directory: `frontend`
   - Build Command: `npm run build` (auto-detected)
   - Output Directory: `.next` (auto-detected)

3. **Environment Variables**
   ```
   NEXT_PUBLIC_API_URL=https://your-backend.onrender.com
   ```

4. **Deploy**
   - Click "Deploy"
   - Your frontend will be live at: `https://your-app.vercel.app`

---

### Option 2: All-in-One VPS (DigitalOcean, AWS, etc.)

```bash
# On your VPS
git clone your-repo
cd outbox

# Start all services
docker-compose up -d
cd backend && npm install && npm run build && npm start &
cd ../frontend && npm install && npm run build && npm start &
```

**Setup Nginx reverse proxy:**
```nginx
# Backend
server {
    listen 80;
    server_name api.yourdomain.com;
    location / {
        proxy_pass http://localhost:3000;
    }
}

# Frontend
server {
    listen 80;
    server_name yourdomain.com;
    location / {
        proxy_pass http://localhost:3001;
    }
}
```

---

## 🌍 External Services

### Elasticsearch

**Option A: Elastic Cloud** (Recommended)
- Free 14-day trial, then $95/month
- https://cloud.elastic.co/

**Option B: Bonsai** (Free tier)
- 125MB storage free
- https://bonsai.io/

### Qdrant Vector Database

**Qdrant Cloud** (Free tier)
- 1GB storage free
- https://cloud.qdrant.io/

### Email Configuration

**Gmail App Passwords:**
1. Enable 2FA on Gmail
2. Go to Google Account → Security → App Passwords
3. Generate password for "Mail"
4. Use this in `EMAIL_X_PASSWORD`

---

## 🔄 CI/CD Setup

### GitHub Actions (Optional)

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to Render
        run: curl -X POST ${{ secrets.RENDER_DEPLOY_HOOK }}

  deploy-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to Vercel
        run: vercel --prod --token=${{ secrets.VERCEL_TOKEN }}
```

---

## 📊 Monitoring

### Render
- Built-in logs and metrics
- Real-time log tailing
- Auto-restart on crashes

### Vercel
- Built-in analytics
- Performance monitoring
- Error tracking

---

## 💰 Cost Breakdown

### Free Tier (Sufficient for Demo)
- **Render:** Free PostgreSQL (512MB)
- **Vercel:** Free Next.js hosting
- **Bonsai:** Free Elasticsearch (125MB)
- **Qdrant Cloud:** Free vector DB (1GB)
- **Total:** $0/month

### Production
- **Render:** $7/month (web service) + $7/month (PostgreSQL 256MB)
- **Vercel:** $20/month (Pro)
- **Elastic Cloud:** $95/month
- **Qdrant Cloud:** Free tier sufficient
- **Total:** ~$129/month

---

## 🔒 Security Checklist

- [ ] Use environment variables for secrets
- [ ] Enable CORS properly
- [ ] Use HTTPS in production
- [ ] Encrypt passwords in database
- [ ] Rate limit API endpoints
- [ ] Validate all inputs
- [ ] Keep dependencies updated

---

## 🐛 Troubleshooting

### Backend won't start
```bash
# Check logs
render logs -f

# Verify DATABASE_URL
echo $DATABASE_URL

# Test locally
cd backend && npm run dev
```

### Frontend can't connect to backend
```bash
# Check NEXT_PUBLIC_API_URL
echo $NEXT_PUBLIC_API_URL

# Test API
curl https://your-backend.onrender.com/health
```

### Database migration issues
```bash
cd backend
npx prisma migrate reset
npx prisma db push
```

---

## 📞 Support

For issues:
1. Check logs (Render/Vercel dashboard)
2. Verify environment variables
3. Test locally with Docker
4. Check service status pages

---

**Happy Deploying!** 🚀

