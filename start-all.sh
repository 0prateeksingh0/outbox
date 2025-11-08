#!/bin/bash

echo "🚀 Starting Email Onebox Application..."
echo ""

# Start Docker services
echo "📦 Starting Docker services..."
docker-compose up -d

# Wait for services
echo "⏳ Waiting for services to be ready..."
sleep 10

# Check Docker services
echo ""
echo "🐳 Docker Services Status:"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

# Start backend
echo ""
echo "🖥️  Starting backend..."
cd backend
npm install > /dev/null 2>&1
npx prisma generate > /dev/null 2>&1
npx prisma db push > /dev/null 2>&1
npm run dev > ../backend.log 2>&1 &
BACKEND_PID=$!
cd ..

# Start frontend
echo "🌐 Starting frontend..."
cd frontend
npm install > /dev/null 2>&1
npm run dev > ../frontend.log 2>&1 &
FRONTEND_PID=$!
cd ..

# Wait for services to start
echo "⏳ Waiting for services to start..."
sleep 15

echo ""
echo "✅ All services started!"
echo ""
echo "╔════════════════════════════════════════════╗"
echo "║  Access your application:                  ║"
echo "║                                            ║"
echo "║  Frontend:  http://localhost:3001          ║"
echo "║  Backend:   http://localhost:3000          ║"
echo "║                                            ║"
echo "║  Backend PID:  $BACKEND_PID                      ║"
echo "║  Frontend PID: $FRONTEND_PID                      ║"
echo "╚════════════════════════════════════════════╝"
echo ""
echo "📝 Logs:"
echo "   Backend:  tail -f backend.log"
echo "   Frontend: tail -f frontend.log"
echo ""
echo "🛑 To stop: pkill -P $BACKEND_PID && pkill -P $FRONTEND_PID"

