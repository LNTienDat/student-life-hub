FROM node:20-alpine AS base

WORKDIR /app

# Cài đặt dependencies
COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci --omit=dev

# Sinh Prisma Client cho môi trường Linux container
RUN npx prisma generate

# Copy toàn bộ mã nguồn backend
COPY . .

ENV NODE_ENV=production
ENV PORT=5000

EXPOSE 5000

CMD ["node", "app.js"]
