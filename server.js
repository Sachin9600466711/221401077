import express from 'express';
import bodyParser from 'body-parser';
import shortUrlRoutes from './url.js';
import logger from './logger.js';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use('/', shortUrlRoutes);

app.listen(PORT, () => {
  logger.info(`Server started at http://localhost:${PORT}`);
});
