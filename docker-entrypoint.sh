#!/bin/sh

# Replace the placeholder or the existing URL with the environment variable
# This allows the same pre-built image to work with different registry URLs
if [ -n "$VITE_REGISTRY_URL" ]; then
  echo "Injecting VITE_REGISTRY_URL=$VITE_REGISTRY_URL into static files..."
  # Search and replace in all JS files in the html directory
  find /usr/share/nginx/html -name "*.js" -exec sed -i "s|https://registry.veexplatform.com/api/v1|$VITE_REGISTRY_URL|g" {} +
  find /usr/share/nginx/html -name "*.js" -exec sed -i "s|http://registry.veexplatform.com/api/v1|$VITE_REGISTRY_URL|g" {} +
fi

exec "$@"
