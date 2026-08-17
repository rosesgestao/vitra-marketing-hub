FROM node:22-slim

WORKDIR /app
COPY . .

WORKDIR /app/dashboard
RUN npm ci && npm run build

ENV NODE_ENV=production
EXPOSE 3000
CMD npx --yes serve -s dist -l $PORT
