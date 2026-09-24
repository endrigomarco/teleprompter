FROM node:24-alpine AS base
ENV COREPACK_HOME=/opt/corepack
RUN corepack enable && corepack prepare yarn@4.9.2 --activate

FROM base AS dependencies
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY package.json yarn.lock .yarnrc.yml ./
RUN yarn install --immutable

FROM dependencies AS tools
COPY --chown=node:node . .
RUN chown node:node /app
USER node
CMD ["yarn", "test"]

FROM dependencies AS builder
COPY . .
RUN yarn build

FROM base AS runtime
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1
COPY --from=builder --chown=node:node /app/package.json /app/yarn.lock /app/.yarnrc.yml ./
COPY --from=builder --chown=node:node /app/node_modules ./node_modules
COPY --from=builder --chown=node:node /app/.yarn/install-state.gz ./.yarn/install-state.gz
COPY --from=builder --chown=node:node /app/.next ./.next
COPY --from=builder --chown=node:node /app/public ./public
COPY --from=builder --chown=node:node /app/src ./src
COPY --from=builder --chown=node:node /app/scripts ./scripts
COPY --from=builder --chown=node:node /app/migrations ./migrations
COPY --from=builder --chown=node:node /app/tsconfig.json /app/next.config.ts ./
COPY --chmod=755 docker/app/entrypoint.sh /usr/local/bin/teleprompter-entrypoint
RUN mkdir -p /app/data /app/backups && chown node:node /app/data /app/backups
USER node
EXPOSE 3000
ENTRYPOINT ["teleprompter-entrypoint"]
CMD ["yarn", "start:container"]
