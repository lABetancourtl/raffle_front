# Etapa de compilación
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build --prod

# Etapa de producción
FROM nginx:alpine
COPY nginx.conf /etc/nginx/nginx.conf
COPY --from=builder /app/dist/raffle_front /usr/share/nginx/html

# Cloud Run usa la variable PORT, configuramos Nginx para escuchar en ese puerto
ENV PORT 8080
EXPOSE 8080

CMD ["sh", "-c", "sed -i 's/listen 80;/listen ${PORT};/' /etc/nginx/conf.d/default.conf && nginx -g 'daemon off;'"]
