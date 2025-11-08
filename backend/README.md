# Backend - Email Onebox API

Node.js + TypeScript + Express backend for email aggregation.

## Features
- Real-time IMAP email synchronization
- Elasticsearch for email search
- AI-powered email categorization
- Slack & webhook notifications
- RAG-based reply suggestions

## Local Development

```bash
# Install dependencies
npm install

# Setup database
npx prisma generate
npx prisma db push

# Run development server
npm run dev
```

## Environment Variables

Create `.env` file:

```env
PORT=3000
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/onebox_db
ELASTICSEARCH_NODE=http://localhost:9200

EMAIL_1_ADDRESS=your-email@gmail.com
EMAIL_1_PASSWORD=your-app-password
EMAIL_1_IMAP_HOST=imap.gmail.com
EMAIL_1_IMAP_PORT=993

OPENAI_API_KEY=your-key
SLACK_WEBHOOK_URL=your-webhook
```

## Deployment (Render)

1. Connect GitHub repository
2. Set build command: `npm install && npx prisma generate && npm run build`
3. Set start command: `npm start`
4. Add environment variables
5. Connect PostgreSQL database

## API Endpoints

- `GET /health` - Health check
- `GET /api/accounts` - List email accounts
- `GET /api/emails` - List emails
- `GET /api/search` - Search emails
- `POST /api/emails/:id/reply-suggestions` - Generate AI reply

