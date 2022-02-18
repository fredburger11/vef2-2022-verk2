import express from 'express';
import { catchErrors } from '../lib/catch-errors.js';
import { listEvents } from '../lib/db.js';

export const router = express.Router();

// eslint-disable-next-line
export function ensureLoggedIn(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }

  return res.redirect('/login');
}
 /*
router.get('/', async (req, res) => {
  const people = await listComments();
  res.render('admin', { title: 'admin svæði', people });
}); */

 /*
router.get('/', async (req, res) => {
  const events = await listEvents();
  res.render('admin', {
    title: 'Viðburðar-umsjón',
    events,
  });
})*/
// eslint-disable-next-line
async function adminRoute(req, res) {
  const events = await listEvents();

  res.render('admin', {
    title: 'Viðburða umsjón',
    events,
  });
}
router.get('/', catchErrors(adminRoute));


 /*
router.get('/logout', (req, res) => {
  req.logout();
  res.redirect('/');
}); */

