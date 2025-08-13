#!/bin/bash

if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    echo "   Visit: https://www.docker.com/products/docker-desktop/"
    exit 1
fi

# Check if .env file exists
if [ ! -f .env ]; then
    echo "📝 Creating .env file..."
    cat > .env << EOF
# Database Configuration
POSTGRES_USER=ais_user
POSTGRES_PASSWORD=ais_password_$(date +%s)
POSTGRES_DB=ais_vessels

# AIS Stream API Key (get from https://aisstream.io/)
AISSTREAM_API_KEY=your_api_key_here

# Node Environment
NODE_ENV=development
EOF
    echo "⚠️  Please edit .env file and add your AISSTREAM_API_KEY"
    echo "   Get your API key from: https://aisstream.io/"
    echo ""
    echo "Press Enter when you've updated the .env file..."
    read
fi

if grep -q "your_api_key_here" .env; then
    echo "⚠️  Please update AISSTREAM_API_KEY in .env file before continuing"
    echo "   Get your API key from: https://aisstream.io/"
    exit 1
fi

echo "🚀 Starting services..."
docker compose up -d --build

echo ""
echo "📊 Checking service status..."
sleep 5
docker compose ps

echo ""
echo "API available at: http://localhost:3000/vessels"
echo "   Test with: curl 'http://localhost:3000/vessels?min_lon=-180&min_lat=-90&max_lon=180&max_lat=90'"
