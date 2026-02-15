# Node.js backend için Dockerfile
FROM node:20-alpine

# Çalışma dizini
WORKDIR /app

# Package files kopyala
COPY package*.json ./

# Bağımlılıkları yükle
RUN npm ci --only=production

# Uygulama dosyalarını kopyala
COPY . .

# Port
EXPOSE 5000

# Sağlık kontrolü
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5000/api/health || exit 1

# Uygulamayı başlat
CMD ["node", "src/app.js"]
