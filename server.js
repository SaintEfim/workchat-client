// для запуска прописываем команду nodemon server.js

// берём Express
import express from 'express';
import { fileURLToPath } from 'url';
import path from 'path';
import cookieParser from 'cookie-parser';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// создаём Express-приложение
var app = express();

app.use(express.static('public'));
app.use(cookieParser());

// создаём маршрут для главной страницы
app.get('/', function (req, res) {
  res.sendFile('public/login-and-registration-index.html', { root: __dirname });
});

// создаём middleware для проверки accessToken
app.use('/chat', (req, res, next) => {
  const accessToken = req.cookies.accessToken;
  if (!accessToken) {
    return res.redirect('/');
  }
  next();
});

// создаём маршрут для чата
app.get('/chat', function (req, res) {
  res.sendFile('public/chat.html', { root: __dirname });
});

// запускаем сервер на порту, указанном в конфигурации 
app.listen(4200, '0.0.0.0', () => {
  console.log('Сервер стартовал на порту 4200!');
});