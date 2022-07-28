// Подключение модулей
const express = require('express') // фреймворк web-приложений для Node.js
  , exphbs = require('express-handlebars') // модуль шаблонизатор 
  , passport = require('passport') // модуль авторизации пользователя 
  , LocalStrategy = require('passport-local') // модуль локальных пользователей 
  , fileUpload = require('express-fileupload') // модуль загрузки файлов на сервер
  , Datastore = require('nedb') // модуль базы данных
  , PostRepository = require('./postrepository.js').PostRepository; // локальный модуль для работы с базой данных 

const db = new Datastore({ filename: './data', autoload: true }); // Создание(подключение) БД в файле data      

const postRepo = new PostRepository(db); // Инициализация локального модуля работы с БД  

const app = express(); // Создание Web-приложения на основе express
app.use(express.static(__dirname + '/public')); // Подключение статических файлов сайта (css, js и т.п.)

var hbs = exphbs.create({defaultLayout: 'main'});// Создание шаблонизатора handlebars с указанием файла-входа main
app.engine('handlebars', hbs.engine);// Указание в качестве шаблонизатора handlebars
app.set('view engine', 'handlebars');// Регистрация шаблонизатора handlebars

app.use(require('body-parser').urlencoded({ extended: true }));// Подключение разбора http-тела 
app.use(require('express-session')({ secret: 'keyboard cat', resave: false, saveUninitialized: false }));// Подключение сессии 

app.use(passport.initialize());// Инициализация модуля авторизации
app.use(passport.session());// Использование сессии в модуле авторизации 
app.use(fileUpload());// Инициализация модуля загрузки файлов 

// Настройка стратегии авторизации
passport.use(new LocalStrategy(
  function(username, password, done) {
    if (username == 'admin' && password == '123456') {
      return done(null, {id: 'admin'});
    }
    return done(null, false);
  }
));

passport.serializeUser(function(user, cb) {
  cb(null, user.id);
});

passport.deserializeUser(function(id, cb) {
  if (id == 'admin') {
    cb(null, {id: 'admin'});
  }
});

// Натсройка порта 
const PORT = process.env.PORT || 8080;

// Функция которая обрезает текст порта до 400 символов
function trimPosts(posts) {
    for (let i = 0; i < posts.length; i++) {
      let post = posts[i];
      post.content = post.content.length > 400 ? post.content.substring(0, 400) + '...' : post.content;
    }
}

// Настройка маршрута главной страницы 
app.get('/', (req, res) => {
  postRepo.getPublishedPosts(function(publishedPosts) { // Получение всех постов из БД
    trimPosts(publishedPosts); // обрезаем текст порта до 400 символов
    let singlePost = publishedPosts.length > 0 ? publishedPosts[0] : null;// Получение 1-го поста
    res.render('home', { // Рендеринг домашней страницы при помощи шаблонизатора, в качестве параметра передаём объект с постами - этот объект пользуется шаблонизатором
      favoritePosts: publishedPosts.slice(0, 2),// Посты для слайдера
      singlePost: singlePost, // Пост слева 
      posts: publishedPosts.slice(2, 5),// Посты справа 
      user: req.user// Пользователь
    });
  });
});

// Настройка маршрута страницы "обо мне"" 
app.get('/about', (req, res) => {
  res.render('about'); //Рендеринг about при помощи шаблонизатора 
});

// Натсройка маршрута страницы "Блог"
app.get('/blog', (req, res) => {
  postRepo.getPublishedPosts(function(publishedPosts) {
    trimPosts(publishedPosts);
    res.render('blog', {posts: publishedPosts, user: req.user}); // Рендеринг blog при помощи шаблонизатора
  });
});

//Настройка маршрута страницы контактов
app.get('/contacts', (req, res) => {
  res.render('contacts', {user: req.user}); // Рендеринг contacts при помощи шаблонизатора 
});

// Настройка маршрута вывода сообщения контакта
app.post('/contacts', (req, res) => {
  res.render('contacts-thanks', {contact: req.body}); // Рендеринг сообщения благодарности при помощи шаблонизатора 
});

// Настройка маршрута  страницы  поста
app.get('/post', (req, res) => {
  if (!req.query.id) return res.status(404).send({text: 'Запись не найдена'}); // Рендеринг индефикатора "query.id" поста при помощи шаблонизатора  

// Настройка маршрута страницы  полученного поста 
  postRepo.getPost(req.query.id, function (post) {
    if (!post) return res.status(404).send({text: 'Запись не найдена'}); 
    res.render('post', {post : post}) // Рендеринг индефикатора "post" при помощи шаблонизатора 
  });
});

// Натсройка маршрута страницы "Создание поста"
app.get('/createpost', (req, res) => {
  // if (!req.user) return res.sendStatus(401);
  res.render('createpost', {user: req.user}); //
});

// Настройка маршрута создания поста
app.post('/createpost', (req, res) => {
  if (!req.body.title || !req.body.content) { // Проверка,что введены заголовок и текст поста 
    return res.status(500).send({text: 'Заполните данные'});
  }

  if (req.files && Object.keys(req.files).length > 0) { // Если загружен файл картинки, то создаем пост вместе с картинкой 
    let fileName = `public/uploads/${req.files.postImage.name}`;// Задаем физический путь файла 
    let imageName = `uploads/${req.files.postImage.name}`;// Задаем относительный URL файла 
    req.files.postImage.mv(fileName, function (err) {// Записываем файл по физическому пути 
      if (err) return res.status(500).send(err);
      postRepo.createPost(req.body.title, req.body.content, imageName, new Date(), function () {// Создание поста в БД 
        res.redirect('/blog');// Перенапрвления на страницу блога
      })
    })
  } else {// Если  файл картинки не загружен, то создаем пост без  картинки
      postRepo.createPost(req.body.title, req.body.content, undefined, new Date(), function () {
        res.redirect('/blog');
      })
  }
});

// Настройка марщрута страницы логина 
app.get('/login',(req, res) => {
  res.render('login', {user: req.user}); // Рендеринг логина при помощи шаблонизатора 
})

// Настройка маршрута входа пользователя 
app.post('/login', 
  passport.authenticate('local', { failureRedirect: '/login' }), // Аутенфикация пользователя и переход обратно на страницу логин,если пользователь не аутентуифицирован 
  function(req, res) { 
    res.redirect('/'); // переход на домашнию страницу, если пользователь аутентуифицирован
});

// Настройка маршрута страницы спортсменов 
app.get('/sportsmans', (req, res) => {
  res.render('sportsmans'); // Рендеринг sportsmans при помощи шаблонизатора
});

// Запуск сервера 
app.listen(PORT, () => {
  console.log(`Server running at: http://localhost:${PORT}/`)
});
