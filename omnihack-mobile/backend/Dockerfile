FROM node:18-alpine

RUN apk add --no-cache python3 make g++ bash ttyd

WORKDIR /app

COPY package.json tsconfig.json jest.config.js ./

RUN npm install

COPY src ./src
COPY tests ./tests
CMD ["npm", "run", "start"]
