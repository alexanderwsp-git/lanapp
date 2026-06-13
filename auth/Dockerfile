# 🏗️ Build Stage
FROM node:20.16.0 AS builder

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

COPY tsconfig.json ./

RUN npm run build

# 🚀 Production Runner
FROM node:20.16.0 AS runner

WORKDIR /app

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
COPY --from=builder /app/tsconfig.json ./

ENV NODE_ENV=production
EXPOSE 1080
CMD ["npm", "start"]

# 🔄 Development Runner with Hot Reload
FROM node:20.16.0 AS dev

WORKDIR /app

COPY package*.json ./
RUN npm install && npm install -g nodemon

COPY . .
COPY tsconfig.json ./

EXPOSE 1080
CMD ["npm", "run", "dev"]