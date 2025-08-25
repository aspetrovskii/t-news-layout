import Fastify from 'fastify';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import fastifyCors from '@fastify/cors';
import fastifyJwt from '@fastify/jwt';
import fastifyStatic from '@fastify/static';
import { uuid } from 'uuidv4';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const fastify = Fastify({ logger: true });

await fastify.register(fastifyCors, {
  origin: 'http://localhost:3000'
});
await fastify.register(fastifyJwt, { secret: process.env.JWT_SECRET || 'supersecret' });
await fastify.register(fastifyStatic, {
  root: path.join(__dirname, '/'),
});

async function readDataFile(filename) {
  try {
    const data = await fs.readFile(path.join(__dirname, 'data', filename), 'utf8');
    return JSON.parse(data);
  } catch (err) {
    fastify.log.error(err);
    return [];
  }
}

async function writeDataFile(filename, data) {
  try {
    await fs.writeFile(path.join(__dirname, 'data', filename), JSON.stringify(data, null, 2));
    return true;
  } catch (err) {
    fastify.log.error(err);
    return false;
  }
}

// fastify.get('/', async () => ({ hello: 'world' }));

fastify.get('/', (req, res) => {
    res.sendFile('src/login/index.html');
});
fastify.get('/login', (req, res) => {
    res.sendFile('src/login/index.html');
});

fastify.get('/signup', (req, res) => {
    res.sendFile('src/signup/signup.html');
});

fastify.get('/main', (req, res) => {
    res.sendFile('src/main/main-auth.html');
});
// fastify.get('/main-noauth', (req, res) => {
//     res.sendFile('src/signup/signup.html');
// });

fastify.get('/comments', (req, res) => {
    res.sendFile('src/comments/comments.html');
});

fastify.get('/profile', (req, res) => {
    res.sendFile('src/profile/profile.html');
});

fastify.get('/search', (req, res) => {
    res.sendFile('src/search-users&posts/search-users&posts.html');
});

fastify.post('/api/login', async (request, reply) => {
  const { username, password } = request.body || {};
  if (!username || !password) return reply.code(400).send({ error: 'Заполните все поля!' });

  const users = await readDataFile('users.json');
  const user = users.find(u => u.name === username);
  if (!user) return reply.code(401).send({ error: 'Неверный логин' });

  if (user.password !== password) return reply.code(401).send({ error: 'Неверный пароль' });

  const expiresIn = '1500m';
  const token = fastify.jwt.sign({ sub: user.id, name: user.name }, { expiresIn });

  const { password: _pwd, ...safeUser } = user;

  return reply.send({ token, user: safeUser });
});

fastify.post('/api/signup', async (request, reply) => {
  const { username, password, rePassword } = request.body || {};
  if (!username || !password) return reply.code(400).send({ error: 'Заполните все поля!' });
  if (password != rePassword) return reply.code(400).send({ error: 'Пароли не совпадают!' });

  const users = await readDataFile('users.json');
  const sameNameUser = users.find(u => u.name === username);
  if(sameNameUser) return reply.code(401).send({error: `Пользователь ${username} уже существует`});

  const user = {
    id: uuid(),
    name: username,
    bio: 'Привет! Я пользователь T-News',
    avatar: '/public/seneka.jpg',
    password: password
  }

  users.push(user);
  await writeDataFile('users.json', users);

  const {password: _pwd, ...safeUser} = user;

  const expiresIn = '1500m';  

  const token = fastify.jwt.sign(
    { sub: user.id, name: user.name },
    { expiresIn }
  );

  return reply.send({ token, user: safeUser });
});

fastify.decorate("authenticate", async (req, reply) => {
  try {
    await req.jwtVerify();
  } catch (err) {
    reply.code(401).send(err);
  }
});

fastify.post('/api/addPost', { preHandler: [fastify.authenticate] }, async (request, reply) => {
  const {content} = request.body || {};
  if (!content) return reply.code(400).send({error: 'Пост должен содержать текст'});

  const posts = await readDataFile('posts.json');
  const post = {
    id: uuid(),
    authorId: request.user.sub,
    content: content,
    likesCount: 0,
    commentsCount: 0,
    likedBy: []
  }
  posts.unshift(post);
  await writeDataFile('posts.json', posts);

  return reply.code(201).send(post);
});

fastify.post('/api/addComment', { preHandler: [fastify.authenticate] }, async (request, reply) => {
  const {content, postId} = request.body || {};
  if (!content) return reply.code(400).send({error: 'Комментарий должен содержать текст'});
  if (!postId) return reply.code(400).send({error: 'Комментарий должен быть привязан к посту'});

  const posts = await readDataFile('posts.json');
  const targetPost = posts.find(p => p.id === postId);
  if(!targetPost) return reply.code(400).send({error: 'Комментарий должен быть к существующему посту'});
  const newPosts = posts.filter(p => p.id !== postId);
  targetPost.commentsCount++;
  newPosts.unshift(targetPost);
  await writeDataFile('posts.json', newPosts);

  const comments = await readDataFile('comments.json');
  const comment = {
    id: uuid(),
    postId: postId,
    authorId: request.user.sub,
    content: content
  }
  comments.push(comment);
  await writeDataFile('comments.json', comments);

  return reply.code(201).send(comment);
});

fastify.post('/api/editName', { preHandler: [fastify.authenticate] }, async (request, reply) => {
  const { newText } = request.body || {};
  if (!newText) return reply.code(400).send({error: 'Имя должно содержать текст'});

  const users = await readDataFile('users.json');
  const sameNameUser = users.find(u => u.name === newText);
  if(sameNameUser) return reply.code(400).send({error: 'Пользователь с таким именем уже существует'});

  const user = users.find(u => u.id === request.user.sub);
  if(!user) return reply.code(400).send({error: 'Неверная авторизация'});

  const newUsers = users.filter(u => u.id !== request.user.sub);
  user.name = newText;
  newUsers.push(user);
  await writeDataFile('users.json', newUsers);

  const {password: _pwd, ...safeUser} = user;

  const expiresIn = '1500m';  

  const token = fastify.jwt.sign(
    { sub: user.id, name: user.name },
    { expiresIn }
  );

  return reply.send({ token, user: safeUser });
});

fastify.post('/api/editInfo', { preHandler: [fastify.authenticate] }, async (request, reply) => {
  const { newText } = request.body || {};
  if (!newText) return reply.code(400).send({error: 'Bio должно содержать текст'});

  const users = await readDataFile('users.json');
  const user = users.find(u => u.id === request.user.sub);
  if(!user) return reply.code(400).send({error: 'Неверная авторизация'});

  const newUsers = users.filter(u => u.id !== request.user.sub);
  user.bio = newText;
  newUsers.push(user);
  await writeDataFile('users.json', newUsers);

  return reply.send({ user });
});

fastify.post('/api/loadPosts', async (request, reply) => {
  const posts = await readDataFile('posts.json');
  return reply.send({ posts });
});

fastify.post('/api/loadUser', async (request, reply) => {
  const {userId} = request.body || {};
  if(!userId) return reply.code(400).send({error: 'Загрузить пользователя: Запрос должен содержать ID пользователя'});

  const users = await readDataFile('users.json');
  const user = users.find(u => u.id === userId);
  if(!user) return reply.code(400).send({error: 'Загрузить пользователя: Неверный ID пользователя в запросе'});

  return reply.send({ user });
});

fastify.post('/api/loadUsers', async (request, reply) => {
  const users = await readDataFile('users.json');
  return reply.send({ users: users });
});

fastify.post('/api/isLiked', { preHandler: [fastify.authenticate] }, async (request, reply) => {
  const { postId } = request.body || {};
  if(!postId) return reply.code(400).send({error: 'Проверить лайк: Запрос должен содержать ID поста'});
  
  const posts = await readDataFile('posts.json');
  const post = posts.find(p => p.id === postId);
  if(!post) return reply.code(400).send({error: 'Поставить лайк: Неверный ID поста в запросе'});
  const liked = post.likedBy.find(uid => uid === request.user.sub);
  if(liked) return reply.send({liked: true});
  else return reply.send({liked: false});
});

fastify.post('/api/like', { preHandler: [fastify.authenticate] }, async (request, reply) => {
  const { postId } = request.body || {};
  if(!postId) return reply.code(400).send({error: 'Поставить лайк: Запрос должен содержать ID поста'});
  
  const posts = await readDataFile('posts.json');
  const post = posts.find(p => p.id === postId);
  if(!post) return reply.code(400).send({error: 'Поставить лайк: Неверный ID поста в запросе'});

  const newPosts = posts.filter(p => p.id !== postId);

  const liked = post.likedBy.find(uid => uid === request.user.sub);
  if (liked) {
    // console.log('dislike\n');
    const newLikedBy = post.likedBy.filter(uid => uid !== request.user.sub);
    post.likedBy = newLikedBy;
    post.likesCount--;
  }
  else {
    // console.log('like\n');
    post.likedBy.push(request.user.sub);
    post.likesCount++;
  }

  newPosts.unshift(post);
  await writeDataFile('posts.json', newPosts);

  return reply.send({post});
});

fastify.post('/api/deletePost', { preHandler: [fastify.authenticate] }, async (request, reply) => {
  const { postId } = request.body || {};
  if(!postId) return reply.code(400).send({error: 'Удалить пост: Запрос должен содержать ID поста'});
  
  const posts = await readDataFile('posts.json');
  const post = posts.find(p => p.id === postId);
  if(!post) return reply.code(400).send({error: 'Удалить пост: Неверный ID поста в запросе'});

  const comms = await readDataFile('comments.json');
  const newComms = comms.filter(c => c.postId !== postId);
  await writeDataFile('comments.json', newComms);

  const newPosts = posts.filter(p => p.id !== postId);
  await writeDataFile('posts.json', newPosts);

  return reply.send({post});
});

fastify.post('/api/loadComms', async (request, reply) => {
  const {postId} = request.body || {};
  if(!postId) return reply.code(400).send({error: 'Загрузить комментарии: Запрос должен содержать ID поста'});

  const comms = await readDataFile('comments.json');
  const newComms = comms.filter(c => c.postId === postId);
  return reply.send({ comms: newComms });
});

fastify.post('/api/deleteComm', { preHandler: [fastify.authenticate] }, async (request, reply) => {
  const { commId } = request.body || {};
  if(!commId) return reply.code(400).send({error: 'Удалить комментарий: Запрос должен содержать ID комментария'});
  
  const comms = await readDataFile('comments.json');
  const comm = comms.find(c => c.id === commId);
  if(!comm) return reply.code(400).send({error: 'Удалить комментарий: Неверный ID комментария в запросе'});

  const posts = await readDataFile('posts.json');
  const targetPost = posts.find(p => p.id === comm.postId);
  if(!targetPost) return reply.code(400).send({error: 'Комментарий должен быть к существующему посту'});
  const newPosts = posts.filter(p => p.id !== comm.postId);
  targetPost.commentsCount--;
  newPosts.unshift(targetPost);
  await writeDataFile('posts.json', newPosts);

  const newComms = comms.filter(p => p.id !== commId);
  await writeDataFile('comments.json', newComms);

  return reply.send({comm});
});

fastify.post('/api/checkUserId', async (request, reply) => {
  const {userId} = request.body || {};

  const users = await readDataFile('users.json');
  const user = users.find(u => u.id === userId);
  if(!user) return reply.code(400).send();
  return reply.send();
});

fastify.post('/api/checkPostId', async (request, reply) => {
  const {postId} = request.body || {};

  const posts = await readDataFile('posts.json');
  const post = posts.find(p => p.id === postId);
  if(!post) return reply.code(400).send();
  return reply.send();
});

fastify.post('/api/getPicSRC', async (request, reply) => {
  const {userId} = request.body || {};
  if(!userId) return reply.code(400).send({error: 'Запрос должен содержать ID пользователя'});
  
  const users = await readDataFile('users.json');
  const user = users.find(u => u.id === userId);
  if(!user) reply.code(400).send({error: 'Неверный ID пользователя'});
  
  return reply.send({picSRC: user.avatar});
});

fastify.post('/api/getUserName', async (request, reply) => {
  const {userId} = request.body || {};
  if(!userId) return reply.code(400).send({error: 'Запрос должен содержать ID пользователя'});
  
  const users = await readDataFile('users.json');
  const user = users.find(u => u.id === userId);
  if(!user) reply.code(400).send({error: 'Неверный ID пользователя'});
  
  return reply.send({name: user.name});
});

fastify.post('/api/getUserBio', async (request, reply) => {
  const {userId} = request.body || {};
  if(!userId) return reply.code(400).send({error: 'Запрос должен содержать ID пользователя'});
  
  const users = await readDataFile('users.json');
  const user = users.find(u => u.id === userId);
  if(!user) reply.code(400).send({error: 'Неверный ID пользователя'});
  
  return reply.send({bio: user.bio});
});

try {
  await fastify.listen({ port: 3000});
  fastify.log.info('Server listening on port 3000');
} catch (err) {
  fastify.log.error(err);
  process.exit(1);
}
