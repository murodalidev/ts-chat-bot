FROM node

WORKDIR /usr/app

ADD package*.json ./

ADD . .

RUN npm run build

CMD ["node", "./dist/main.js"]
