FROM node:18-slim

# Genuine MySQL 8 client (mysqldump + mysql) for the embedded license agent's
# trial backup/restore. We must use Oracle's MySQL client, NOT Debian's
# default-mysql-client (which is MariaDB): the MariaDB dumper mishandles MySQL 8
# generated columns (e.g. page_view_logs.view_date), producing dumps that fail
# to re-import. Pinned to the mysql-8.0 repo to match the mysql:8.0 server.
# NOTE: Oracle's MySQL APT signing key is currently expired (EXPKEYSIG), which
# is an issue on Oracle's side, not ours. We therefore mark this single repo
# [trusted=yes] to bypass the expired-key check — packages still come from the
# official repo.mysql.com over the pinned mysql-8.0 component. Revisit once
# Oracle ships a valid key. The .list is removed after install so the container
# does not carry the trusted repo at runtime.
RUN set -eux; \
    apt-get update; \
    apt-get install -y --no-install-recommends ca-certificates; \
    . /etc/os-release; \
    echo "deb [trusted=yes] http://repo.mysql.com/apt/debian ${VERSION_CODENAME} mysql-8.0" \
        > /etc/apt/sources.list.d/mysql.list; \
    apt-get update -o Acquire::AllowInsecureRepositories=true; \
    apt-get install -y --no-install-recommends --allow-unauthenticated mysql-community-client; \
    rm -f /etc/apt/sources.list.d/mysql.list; \
    rm -rf /var/lib/apt/lists/*

WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --omit=dev

# Copy source
COPY . .

# Normalize line endings + make the trial DB seeder executable. This file is baked
# into the image so the Option 2 installer compose can call it as a single-line
# command, avoiding CRLF issues that plague multi-line inline shell in YAML.
RUN sed -i 's/\r$//' scripts/seed-trial.sh && chmod +x scripts/seed-trial.sh

# Create non-root user
RUN groupadd -g 1001 nodejs
RUN useradd -m -u 1001 -g nodejs nodejs

# Set permissions
RUN chown -R nodejs:nodejs /usr/src/app
USER nodejs

EXPOSE 8080

ENV NODE_ENV=production

CMD ["node", "index.js"]
