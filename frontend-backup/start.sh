#!/bin/bash

echo "🚀 Bağış Platformu Frontend Başlatılıyor..."

# Port kontrolü
PORT=8080
if lsof -Pi :$PORT -sTCP:LISTEN -t >/dev/null ; then
    echo "⚠️ Port $PORT zaten kullanımda!"
    PORT=8081
    echo "📡 Port $PORT kullanılacak"
fi

echo "🌐 Frontend http://localhost:$PORT adresinde açılacak"
echo "📋 Ctrl+C ile durdurun"
echo ""

# Python3 kontrolü
if command -v python3 &> /dev/null; then
    echo "🐍 Python3 ile HTTP server başlatılıyor..."
    python3 -m http.server $PORT
elif command -v python &> /dev/null; then
    echo "🐍 Python ile HTTP server başlatılıyor..."
    python -m http.server $PORT
elif command -v npx &> /dev/null; then
    echo "📦 Node.js ile HTTP server başlatılıyor..."
    npx http-server -p $PORT
else
    echo "❌ Hata: Python veya Node.js bulunamadı!"
    echo "Lütfen aşağıdakilerden birini yükleyin:"
    echo "  - Python3: sudo apt install python3"
    echo "  - Node.js: https://nodejs.org/"
    exit 1
fi 