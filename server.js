// для запуска прописываем команду nodemon server.js

// берём Express
import express from 'express';
import { fileURLToPath } from 'url'
import path from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// создаём Express-приложение
var app = express();

app.use(express.static('public'));

// создаём маршрут для главной страницы
// http://localhost:4200/
app.get('/', function(req, res) {
  res.sendFile('public/login-and-registration-index.html', { root: __dirname });
});

// запускаем сервер на порту 4200
app.listen(4200);
// отправляем сообщение
console.log('Сервер стартовал!');