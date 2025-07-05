// url.js
import express from 'express';
import logger from './logger.js';

const router = express.Router();

const shortLinks = new Map();        
const clickStats = new Map();        

function generateShortcode(length = 6) {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let code = '';
  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

router.post('/shorturls', (req, res) => {
  const { url, validity = 30, shortcode } = req.body;

  if (!url || typeof url !== 'string') {
    logger.error('Invalid URL received');
    return res.status(400).json({ error: 'URL is required and must be a string' });
  }

  const code = shortcode || generateShortcode();
  const now = new Date();
  const expiryDate = new Date(now.getTime() + validity * 60000).toISOString();

  shortLinks.set(code, {
    url,
    createdAt: now.toISOString(),
    expiryDate,
    clicks: 0,
    clickDetails: [],
  });

  logger.info(`Short URL created: ${code} for ${url}`);

  res.status(201).json({
    shortLink: `https://hostname:port/${code}`,
    expiry: expiryDate
  });
});

router.get('/shorturls/:shortcode', (req, res) => {
  const code = req.params.shortcode;
  const entry = shortLinks.get(code);

  if (!entry) {
    logger.warn(`Stats request failed: Shortcode "${code}" not found`);
    return res.status(404).json({ error: 'Shortcode not found' });
  }

  const stats = {
    totalClicks: entry.clicks,
    url: entry.url,
    createdAt: entry.createdAt,
    expiry: entry.expiryDate,
    clickDetails: entry.clickDetails
  };

  logger.info(`Stats retrieved for shortcode: ${code}`);

  res.status(200).json(stats);
});

router.get('/:shortcode', (req, res) => {
  const code = req.params.shortcode;
  const entry = shortLinks.get(code);

  if (!entry) {
    logger.warn(`Redirect failed: Shortcode "${code}" not found`);
    return res.status(404).send('Shortcode not found');
  }

  const now = new Date();
  if (new Date(entry.expiryDate) < now) {
    logger.warn(`Redirect failed: Shortcode "${code}" has expired`);
    return res.status(410).send('Short URL has expired');
  }

  entry.clicks += 1;
  entry.clickDetails.push({
    timestamp: now.toISOString(),
    referrer: req.get('Referrer') || 'direct',
    location: req.ip
  });

  logger.info(`Redirecting shortcode "${code}" to ${entry.url}`);
  return res.redirect(entry.url);
});

export default router;
