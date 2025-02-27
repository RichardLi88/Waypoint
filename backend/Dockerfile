FROM node:22-alpine AS builder

WORKDIR /app
COPY package*.json ./
ENV NODE_ENV=development
RUN npm install
COPY . .

RUN npm run build

FROM node:22-alpine AS development

WORKDIR /app
COPY package*.json ./
ENV NODE_ENV=development
RUN npm install
COPY . .

EXPOSE 3001
CMD ["npm", "run", "dev"]

FROM node:22-alpine AS production

WORKDIR /app
COPY --from=builder /app/build /app/build
COPY --from=builder /app/package*.json /app/
ENV NODE_ENV=production
RUN npm install
RUN npm install pm2 -g

EXPOSE 3001
CMD [ "pm2-runtime", "./build/index.js" ]
