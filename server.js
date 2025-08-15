import Fastify from 'fastify';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import fastifyCors from '@fastify/cors';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const fastify = Fastify({ logger: true });

await fastify.register(fastifyCors, {
  origin: 'http://127.0.0.1:5500'
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

fastify.get('/', async () => ({ hello: 'world' }));

fastify.post('/api/login', async (request, reply) => {
  const { username, password } = request.body || {};
  if (!username || !password) return reply.code(400).send({ error: 'Заполните все поля!' });

  const users = await readDataFile('users.json');
  const user = users.find(u => u.name === username);
  if (!user) return reply.code(401).send({ error: 'Неверный логин' });

  if (user.password !== password) return reply.code(401).send({ error: 'Неверный пароль' });

  return reply.send({ ok: true, username: user.name });
});

fastify.post('/api/signup', async (request, reply) => {
  const { username, password, rePassword } = request.body || {};
  if (!username || !password) return reply.code(400).send({ error: 'Заполните все поля!' });
  if (password != rePassword) return reply.code(400).send({ error: 'Пароли не совпадают!' });

  const users = await readDataFile('users.json');
  const sameNameUser = users.find(u => u.name === username);
  if(sameNameUser) return reply.code(401).send({error: `Пользователь ${username} уже существует`});

  const user = {
    id: `${users.length + 1}`,
    name: username,
    bio: 'Привет! Я пользователь T-News',
    avatar: null,
    password: password
  }

  users.push(user);

  await writeDataFile('users.json', users);
  return reply.send({ok: true, username: user.name});
});

try {
  await fastify.listen({ port: 3000});
  fastify.log.info('Server listening on port 3000');
} catch (err) {
  fastify.log.error(err);
  process.exit(1);
}
