# L-3.1 — Admin panel (Vite SPA) → nginx
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
ARG VITE_API_URL=https://api.example.com
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

FROM nginx:1.27-alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
# Runtime API-URL injection for trial/hosted mode: this script runs at container
# start (nginx docker-entrypoint hook) and regenerates /config.js from env vars.
COPY docker-entrypoint.sh /docker-entrypoint.d/20-trial-config.sh
# Strip any CR (Windows CRLF) so the shebang resolves, then make it executable.
RUN sed -i 's/\r$//' /docker-entrypoint.d/20-trial-config.sh \
    && chmod +x /docker-entrypoint.d/20-trial-config.sh
EXPOSE 80
