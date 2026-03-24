FROM node:22-bookworm-slim AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY tsconfig.json src assets ./
RUN npm run build

FROM node:22-bookworm-slim AS runtime

ENV NODE_ENV=production
ENV PORT=3000

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=build /app/dist ./dist
COPY --from=build /app/assets ./assets

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD ["node","-e","const port=process.env.PORT||3000;fetch(`http://127.0.0.1:${port}/health`).then((response)=>{if(!response.ok)process.exit(1);}).catch(()=>process.exit(1));"]

USER node

CMD ["node","dist/src/server.js"]
