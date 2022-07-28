PostRepository = function(db) { // Создание объекта для работы с БД
  this.db = db;
};

PostRepository.prototype.getPublishedPosts = function(callback) { // Функция получения всех постов из БД
  var publishedBefore = new Date(); // Задание текущей даты и времени 
  publishedBefore.setHours(23,59,59,999);// Устанавливаем максимальное время в текущей дате 

  this.db
    .find({publishDate : { $lte: publishedBefore }}) // Получаем из БД все посты у которых дата публикации меньше или равна дате publishedBefore 
    .sort({ publishDate: -1 }) // и сортируем их по дате
    .exec(function (err, docs) { 
      callback(docs); // Вызываем функцию обратного вызова 
  });
};

PostRepository.prototype.getPost = function (id, callback) {// функция получение одного поста по id  
  this.db.findOne({_id : id}).exec(function (err, post) { // Находим один пост в БД по id 
    callback(post);
  })
};

PostRepository.prototype.createPost = function(title, content, imageName, publishdate, callback) {//Функция создания поста 
  var doc = { // Объект поста 
    title: title, 
    content: content, 
    imageName: imageName,
    publishDate: publishdate,
    comments: []
	};

  this.db.insert(doc, function (err, newDoc) {// Объект поста записывается в БД
    callback();
	});
};

exports.PostRepository = PostRepository; // Экспортируется модуль 
