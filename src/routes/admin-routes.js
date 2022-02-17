import express from 'express';
import { listComments } from '../lib/db.js';

export const router = express.Router();

export function ensureLoggedIn(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }

  return res.redirect('/login');
}

router.get('/', async (req, res) => {
  const people = await listComments();
  res.render('admin', { title: 'admin svæði', people });
});
