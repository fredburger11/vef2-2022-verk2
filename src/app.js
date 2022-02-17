import dotenv from 'dotenv';
import express from 'express';
import session from 'express-session';
import passport from 'passport';
import { Strategy } from 'passport-local';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { isInvalid } from './lib/template-helpers.js';
import { indexRouter } from './routes/index-routes.js';
import { body, validationResult } from 'express-validator';
import { router as adminRouter } from './routes/admin-routes.js';
import { createComment } from './lib/db.js';


import {
  comparePasswords,
  findByUsername,
  findById,
} from './lib/users.js';
import xss from 'xss';

dotenv.config();

const app = express();

// Sér um að req.body innihaldi gögn úr formi
app.use(express.urlencoded({ extended: true }));

const {
 HOST: hostname = '127.0.0.1',
 PORT: port = 3000,
 SESSION_SECRET: sessionSecret = 'asdklfj',
 DATABASE_URL: databaseUrl,
} = process.env;

 if (!sessionSecret || !databaseUrl) {
  console.error('Vantar .env gildi');
  process.exit(1);
}

app.use(session({
  secret: sessionSecret,
  resave: false,
  saveUninitialized: false,
}));

const nationalIdPattern = '^[0-9]{6}-?[0-9]{4}$';



const path = dirname(fileURLToPath(import.meta.url));

app.use(express.static(join(path, '../public')));

app.set('views', join(path, '../views'));
app.set('view engine', 'ejs');

async function strat(username, password, done) {
  try {
    const user = await findByUsername(username);

    if (!user) {
      return done(null, false);
    }

    // Verður annað hvort notanda hlutur ef lykilorð rétt, eða false
    const result = await comparePasswords(password, user.password);

    return done(null, result ? user : false);
  } catch (err) {
    console.error(err);
    return done(err);
  }
}

passport.use(new Strategy({
  usernameField: 'username',
  passwordField: 'password',
}, strat));

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await findById(id);
    return done(null, user);
  } catch (error) {
    return done(error);
  }
});

app.use(passport.initialize());
app.use(passport.session());

app.use('/admin', adminRouter);



app.post(
  '/login',
  passport.authenticate('local', {
    failureMessage: 'Notandanafn eða lykilorð vitlaust.',
    failureRedirect: '/login',
  }),
  (req, res) => {
    res.redirect('/admin');
  },
);

app.get('/logout', (req, res) => {
  req.logout();
  res.redirect('/');
});



app.get('/login', (req, res) => {
  if (req.isAuthenticated()) {
    return res.redirect('/');
  }

  let message = '';

  // Athugum hvort einhver skilaboð séu til í session, ef svo er
  //  birtum þau og hreinsum skilaboð
  if (req.session.messages && req.session.messages.length > 0) {
    message = req.session.messages.join(', ');
    req.session.messages = [];
  }

  return res.send(`
    <form method="post" action="/login">
      <label>Notendanafn: <input type="text" name="username"></label>
      <label>Lykilorð: <input type="password" name="password"></label>
      <button>Innskrá</button>
    </form>
    <p>${message}</p>
  `);
});



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

const sanitazion = [
  body('name').trim().escape(),
  body('email').normalizeEmail(),
  body('name').customSanitizer((value) => xss(value)),

  // fyrir alla reitina!!!!!!
]

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


app.post('/post', validation, validationResults,sanitazion, postComment);

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
