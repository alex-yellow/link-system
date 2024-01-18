// Импорт необходимых модулей
const express = require('express');
const router = express.Router();

// Импорт пула соединений с базой данных и функции для проверки аутентификации
const pool = require('../db');
const { isAuth } = require('../middleware/isAuth');

// Маршрут для отображения формы добавления новой ссылки (доступен только для авторизованных пользователей)
router.get('/add', isAuth, (req, res) => {
    res.render('links/add');  // Рендеринг страницы 'links/add'
});

// Маршрут для обработки POST-запроса на добавление новой ссылки в базу данных (доступен только для авторизованных пользователей)
router.post('/add', isAuth, (req, res) => {
    // Извлечение данных из тела запроса
    const { Title, Url, Description } = req.body;

    // Формирование новой ссылки
    const newLink = {
        User_id: req.session.user.id,
        Title,
        Url,
        Description
    };

    // Вставка новой ссылки в базу данных
    pool.query('INSERT INTO links SET ?', [newLink], (error) => {
        if (error) {
            console.error(error);
            return res.status(500).send('Internal Server Error');
        }

        // Установка flash-сообщения об успешном сохранении ссылки
        req.flash('success', 'Link add success');

        // Перенаправление на страницу со списком ссылок
        res.redirect('/links');
    });
});

// Маршрут для отображения списка всех ссылок пользователя (доступен только для авторизованных пользователей)
router.get('/', isAuth, (req, res) => {
    // Запрос всех ссылок из базы данных для текущего пользователя
    pool.query('SELECT * FROM links WHERE User_id = ?', [req.session.user.id], (error, links) => {
        if (error) {
            console.error('Ошибка при запросе к базе данных:', error);
            res.status(500).send('Internal Server Error');
        } else {
            // Рендеринг страницы 'links/list' с передачей данных о ссылках
            res.render('links/list', { links: links, user: req.session.user });
        }
    });
});

// Маршрут для удаления ссылки по идентификатору (доступен только для авторизованных пользователей)
router.get('/delete/:id', isAuth, (req, res) => {
    const id = req.params.id;

    // Удаление ссылки из базы данных по идентификатору
    pool.query('DELETE FROM links WHERE id = ?', [id], (error) => {
        if (error) {
            console.error(error);
            return res.status(500).send('Internal Server Error');
        }

        // Установка flash-сообщения об успешном удалении ссылки
        req.flash('success', 'Link delete success');

        // Перенаправление на страницу со списком ссылок
        res.redirect('/links');
    });
});

// Маршрут для отображения формы редактирования ссылки по идентификатору (доступен только для авторизованных пользователей)
router.get('/edit/:id', isAuth, (req, res) => {
    const id = req.params.id;

    // Запрос данных о ссылке для редактирования
    pool.query('SELECT * FROM links WHERE id = ?', [id], (error, results) => {
        if (error) {
            console.error(error);
            return res.status(500).send('Internal Server Error');
        }

        const link = results[0];

        if (!link) {
            // Обработка случая, когда запись не найдена
            return res.status(404).send('Link not found');
        }

        // Продолжение обработки, когда запись найдена
        console.log(link);
        res.render('links/edit', { link });
    });
});

// Маршрут для обработки POST-запроса на редактирование ссылки по идентификатору (доступен только для авторизованных пользователей)
router.post('/edit/:id', isAuth, (req, res) => {
    const id = req.params.id;

    // Извлечение данных из тела запроса
    const { Title, Description, Url } = req.body;

    // Формирование отредактированной ссылки
    const editedLink = {
        Title,
        Description,
        Url
    };

    // Обновление данных в базе данных по идентификатору
    pool.query('UPDATE links SET ? WHERE id = ?', [editedLink, id], (error) => {
        if (error) {
            console.error(error);
            return res.status(500).send('Internal Server Error');
        }

        // Установка flash-сообщения об успешном обновлении ссылки
        req.flash('success', 'Link updated success');

        // Перенаправление на страницу со списком ссылок
        res.redirect('/links');
    });
});

// Экспорт роутера для использования в других частях приложения
module.exports = router;