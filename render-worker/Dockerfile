# Imagem oficial do Puppeteer ja vem com Chrome + libs
FROM ghcr.io/puppeteer/puppeteer:23.0.0

WORKDIR /app
COPY package.json ./
USER root
RUN npm install --omit=dev && chown -R pptruser:pptruser /app
USER pptruser
COPY . .
ENV NODE_ENV=production
EXPOSE 8787
CMD ["node", "src/worker.js"]
