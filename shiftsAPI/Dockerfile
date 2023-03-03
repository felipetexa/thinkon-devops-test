FROM node:8.16.1-alpine
WORKDIR /app
COPY package.json /app 
RUN npm install
EXPOSE 3001
COPY . /app
CMD node index.js
