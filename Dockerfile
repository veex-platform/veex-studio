# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
# Increase memory limit just in case
ENV NODE_OPTIONS="--max-old-space-size=4096"

# Accept build argument for API URL
# Default: https://registry.veexplatform.com/api/v1
ARG VITE_REGISTRY_URL
ENV VITE_REGISTRY_URL=$VITE_REGISTRY_URL

RUN npm run build

# Production stage
FROM nginx:alpine

# Install findutils to support 'find' with '-exec' in the entrypoint script
RUN apk add --no-cache findutils

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY docker-entrypoint.sh /usr/local/bin/

RUN chmod +x /usr/local/bin/docker-entrypoint.sh

EXPOSE 80

ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]
