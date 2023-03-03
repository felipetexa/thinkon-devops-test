FROM node:8.16.1-alpine
WORKDIR /app
COPY package.json /app 
RUN npm install
EXPOSE 3000
COPY . /app
CMD node index.js
