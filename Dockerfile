# Build stage
FROM node:20-slim AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
RUN ls -la /app/dist  # Debug: Check build output

# Production stage
FROM nginx:alpine
RUN apk add --update nodejs npm
COPY --from=build /app/dist/public /usr/share/nginx/html
COPY --from=build /app /app
COPY nginx/nginx.conf /etc/nginx/conf.d/default.conf
RUN nginx -t  # Test config
EXPOSE 80
CMD ["sh", "-c", "cd /app && npm start & nginx -g 'daemon off;'"]
