import dotenv from 'dotenv';
import express from 'express';
import pg from 'pg';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { isInvalid } from './lib/template-helpers.js';
import { indexRouter } from './routes/index-routes.js';
import { body, validationResult } from 'express-validator';
import { query, end } from './lib/db.js';

dotenv.config();

const {
 HOST: hostname = '127.0.0.1',
 PORT: port = 3000,
 DATABASE_URL: connectionString,
 NODE_ENV: nodeEnv,
 } = process.env;

console.log('connectionString :>> ', connectionString);

const app = express();

const nationalIdPattern = '^[0-9]{6}-?[0-9]{4}$';

// Sér um að req.body innihaldi gögn úr formi
app.use(express.urlencoded({ extended: true }));

const path = dirname(fileURLToPath(import.meta.url));

app.use(express.static(join(path, '../public')));

app.set('views', join(path, '../views'));
app.set('view engine', 'ejs');



app.locals.isInvalid = isInvalid;

/*
app.locals = {
  // TODO hjálparföll fyrir template

};*/

app.get('/', (req, res) => {

  res.render('form', {
    title: 'Formið mitt',
    errors: [],
    data: {},
  });
});

async function createComment({ name, email, nationalId, comment }) {
  const q = `
    INSERT INTO
      people(name, email, nationalId, comment)
    VALUES
      ($1, $2, $3, $4)
    RETURNING *`;
  const values = [name, email, nationalId, comment];

  const result = await query(q, values);
  console.log('result :>> ', result);
  return result !== null;
}

const validation = [
  body('name').isLength({ min: 1 }).withMessage('Nafn má ekki vera tómt'),
  body('email').isLength({ min: 1 }).withMessage('Netfang má ekki vera tómt'),
  body('email').isEmail().withMessage('Netfang verður að vera gilt netfang'),
  body('nationalId')
    .isLength({ min: 1 })
    .withMessage('Kennitala má ekki vera tóm'),
  body('nationalId')
    .matches(new RegExp(nationalIdPattern))
    .withMessage('Kennitala verður að vera á formi 000000-0000 eða 0000000000'),
];

const validationResults =  (req, res, next) => {
  const { name = '', email = '', nationalId = '', comment = '' } = req.body;

  const result = validationResult(req);

  if (!result.isEmpty()) {
    //const errorMessages = errors.array().map((i) => i.msg);
    return res.render('form', {
      title: 'Formið mitt',
      errors: result.errors,
      data: { name, email, nationalId, comment },
    });
  }

  return next();
}

const postComment = async (req, res) => {
  const { name, email, nationalId, comment } = req.body;
  console.log('req.body :>> ', req.body);

  const created = await createComment({ name, email, nationalId, comment });

if(created) {
  return res.send('<p>Athugasemd móttekin</p>');
}

return res.render('form', {
    title: 'Formið mitt',
    errors: [{ param: '', msg: 'Gat ekki búið til athugasemd' }],
    data: { name, email, nationalId, comment },
  });
}

app.post('/post', validation, validationResults, postComment);

app.use('/', indexRouter);
// TODO admin routes

/** Middleware sem sér um 404 villur. */
app.use((req, res) => {
  const title = 'Síða fannst ekki';
  res.status(404).render('error', { title });
});

/** Middleware sem sér um villumeðhöndlun. */
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  const title = 'Villa kom upp';
  res.status(500).render('error', { title });
});

app.listen(port, () => {
  console.info(`Server running at http://localhost:${port}/`);
});
