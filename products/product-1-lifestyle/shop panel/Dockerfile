# L-3.1 — Shop panel (Next.js)
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
# Use `npm install` (not `npm ci`) because the committed lock file has drifted
# from package.json (missing optional platform deps). install reconciles it for
# the linux build image; switch back to `npm ci` once the lock is resynced.
RUN npm install --no-audit --no-fund

FROM node:20-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ARG NEXT_PUBLIC_API_URL=https://api.example.com
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=5000
COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public
COPY --from=build /app/package*.json ./
COPY --from=build /app/node_modules ./node_modules
EXPOSE 5000
CMD ["npm", "run", "start"]
