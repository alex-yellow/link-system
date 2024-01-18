const express = require('express');
const router = express.Router();
const db = require('../db');
const bcrypt = require('bcrypt');
const { isAuth } = require('../middleware/isAuth');

// Рендеринг главной страницы
router.get('/', (req, res) => {
    res.render('auth/index', {user:req.session.user, title:'Task Manager'});
});

// Рендеринг страницы регистрации
router.get('/signup', (req, res) => {
    res.render('auth/signup', {title:'Registration user'});
});

// Обработка данных регистрации
router.post('/signup', (req, res) => {
    try {
        const { name, password } = req.body;
        // Валидация данных
        if (!name || !password) {
            return res.render('auth/signup', { error: 'Please provide both name and password' });
        }

        // Проверка существования пользователя с таким именем
        db.query('SELECT * FROM users WHERE name = ?', [name], (error, results) => {
            if (error) {
                console.error(error);
                return res.render('auth/signup', { error: 'Database error' });
            }

            if (results.length > 0) {
                return res.render('auth/signup', { error: 'User with this name already exists' });
            }

            // Хеширование пароля
            bcrypt.hash(password, 10, (hashError, hashedPassword) => {
                if (hashError) {
                    console.error(hashError);
                    return res.render('auth/signup', { error: 'Hashing failed' });
                }

                // Создание нового пользователя
                db.query('INSERT INTO users (name, password) VALUES (?, ?)', [name, hashedPassword], (insertError) => {
                    if (insertError) {
                        console.error(insertError);
                        return res.render('auth/signup', { error: 'Registration failed' });
                    }
                    req.session.successreg = 'Registration completed success';
                    res.redirect('/signin');
                });
            });
        });
    } catch (error) {
        console.error(error);
        res.render('auth/signup', { error: 'Unexpected error' });
    }
});

// Рендеринг страницы входа
router.get('/signin', (req, res) => {
    const successReg = req.session.successreg;
    delete req.session.successreg;
    res.render('auth/signin', {successReg, title:'Login'});
});

// Обработка данных входа
router.post('/signin', (req, res) => {
    const { name, password } = req.body;
    // Валидация данных
    if (!name || !password) {
        return res.render('auth/signin', { error: 'Please provide both name and password' });
    }

    // Поиск пользователя по имени
    db.query('SELECT * FROM users WHERE name = ?', [name], (error, results) => {
        if (error) {
            console.error(error);
            return res.render('auth/signin', { error: 'Database error' });
        }

        const user = results[0];

        // Проверка пароля
        if (user) {
            bcrypt.compare(password, user.password, (compareError, passwordMatch) => {
                if (compareError) {
                    console.error(compareError);
                    return res.render('auth/signin', { error: 'Login failed' });
                }

                if (passwordMatch) {
                    // Аутентификация успешна
                    req.session.user = user;
                    req.session.save();
                    console.log('User in session:', req.session.user);
                    res.redirect('/');
                } else {
                    res.render('auth/signin', { error: 'Invalid name or password' });
                }
            });
        } else {
            res.render('auth/signin', { error: 'Invalid name or password' });
        }
    });
});

// Выход
router.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/signin');
});

router.get('/profile', isAuth, (req, res) => {
    res.render('profile');
});

module.exports = router;