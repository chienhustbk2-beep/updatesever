#!/bin/bash
# ========================================
# CÀI ĐẶT LẦN ĐẦU TRÊN VPS
# Dùng sau khi clone repo về hoặc copy files
# ========================================
set -e

echo "=== Bước 1: Cài dependencies ==="
npm install

echo "=== Bước 2: Tạo file .env ==="
if [ ! -f .env ]; then
  cat > .env << 'EOF'
DATABASE_URL="file:./prisma/dev.db"
NEXTAUTH_SECRET="thay-bang-key-ngau-nhien"
NEXTAUTH_URL="http://localhost:3000"
AUTH_TRUST_HOST="true"
CRON_SECRET="thay-bang-key-khac"
UPDATE_VERSION_URL=""
UPDATE_ZIP_URL=""
EOF
  echo "Đã tạo .env mẫu. Hãy sửa các giá trị phù hợp."
else
  echo ".env đã tồn tại, bỏ qua."
fi

echo "=== Bước 3: Generate Prisma client ==="
npx prisma generate

echo "=== Bước 4: Push database ==="
npx prisma db push

echo "=== Bước 5: Seed dữ liệu ==="
npx prisma db seed

echo "=== Bước 6: Build ==="
npm run build

echo "=== Bước 7: Cài PM2 + chạy ==="
npm install -g pm2 2>/dev/null || true
pm2 delete ecommerce 2>/dev/null || true
pm2 start npm --name "ecommerce" -- start

echo "=== HOÀN TẤT ==="
echo "Truy cập: http://$(curl -s ifconfig.me):3000"
