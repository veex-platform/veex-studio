# Build stage
FROM node:20-alpine AS builder

ARG VITE_REGISTRY_URL="https://registry.veexplatform.com"
ENV VITE_REGISTRY_URL=$VITE_REGISTRY_URL

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Build the studio
RUN npm run build

# Final stage
FROM nginx:alpine

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy build artifacts to nginx public directory
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose port 80
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
