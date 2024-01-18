// Импорт необходимых модулей
const express = require('express');
const router = express.Router();

// Маршрут для обработки GET-запроса к корневому пути '/'
router.get('/', (req, res) => {
    res.render('index', {user:req.session.user});  // Отправка ответа с рендерингом страницы 'index'
});

// Экспорт роутера для использования в других частях приложения
module.exports = router;