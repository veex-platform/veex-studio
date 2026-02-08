# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
# Increase memory limit just in case
ENV NODE_OPTIONS="--max-old-space-size=4096"

# Accept build argument for API URL
ARG VITE_REGISTRY_URL
ENV VITE_REGISTRY_URL=$VITE_REGISTRY_URL

RUN npm run build

# Production stage
FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
