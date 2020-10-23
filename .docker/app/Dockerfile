FROM node:12.13-alpine As development

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm i -g @nestjs/cli
RUN npm install

COPY . .

RUN npm run build