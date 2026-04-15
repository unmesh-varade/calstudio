const cors = require('cors');
const express = require('express');

const { env } = require('./config/env');
const { errorHandler } = require('./middleware/error-handler');
const { notFound } = require('./middleware/not-found');
const apiRouter = require('./routes');

const app = express();

app.use(
  cors({
    origin: env.corsOrigins,
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api', apiRouter);
app.use(notFound);
app.use(errorHandler);

module.exports = app;
