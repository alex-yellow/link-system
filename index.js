// Импорт необходимых модулей
const express = require('express');
const morgan = require('morgan');
const exphbs = require('express-handlebars');
const path = require('path');
const flash = require('connect-flash');
const session = require('express-session');
const mysqlstore = require('express-mysql-session')(session);
const mysql = require('mysql');

const dbConnection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'links',
});

// Обработка ошибки соединения
dbConnection.connect((err) => {
    if (err) {
        console.error('Ошибка соединения с базой данных:', err);
        process.exit(1); // Завершение процесса Node.js с кодом ошибки
    }
    console.log('Успешное подключение к базе данных');
});

// Обработка события ошибки в соединении
dbConnection.on('error', (err) => {
    console.error('Ошибка в соединении с базой данных:', err);
    dbConnection.end(); // Закрытие соединения при ошибке
});

const sessionStore = new mysqlstore({
    expiration: 86400000, // Время жизни сессии в миллисекундах (в данном случае 1 день)
    createDatabaseTable: true, // Создать таблицу для сессий, если её нет
    schema: {
        tableName: 'sessions', // Название таблицы для сессий
    },
}, dbConnection);

/* Инициализация */
// Создание экземпляра приложения Express
const app = express();


/* Настройки */
// Установка конфигураций на уровне приложения
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.engine('.hbs', exphbs({
    defaultLayout: 'main',
    layoutsDir: path.join(app.get('views'), 'layouts'),
    partialsDir: path.join(app.get('views'), 'partials'),
    extname: '.hbs',
}));

app.set('view engine', '.hbs');

/* Промежуточные обработчики (Middleware) */
// Использование сессии
app.use(session({
    secret: 'crud_links_session',
    resave: false,
    saveUninitialized: false,
    store: sessionStore,
}));
// Использование Connect Flash для управления сообщениями
app.use(flash());
// Использование morgan для логирования в разработке
app.use(morgan('dev'));
// Обработка данных из формы
app.use(express.urlencoded({ extended: false }));
app.use(express.json());


/* Глобальные переменные */
app.use((req, res, next) => {
    app.locals.success = req.flash('success');
    app.locals.message = req.flash('message');
    app.locals.user = req.user;
    next();
});

/* Маршруты */
app.use(require('./routes'));
app.use(require('./routes/auth'));
app.use('/links', require('./routes/links'));

/* Статические файлы */
app.use(express.static(path.join(__dirname, 'public')));

/* Запуск сервера */
app.listen(app.get('port'), () => {
    console.log('Сервер запущен на порту: ' + app.get('port'));
});