FROM node:16

WORKDIR /usr/src/app

COPY package*.json ./

# Устанавливаем зависимости
RUN npm install

COPY . .

EXPOSE 4200

# Запускаем сервер
CMD ["npm", "start"]
