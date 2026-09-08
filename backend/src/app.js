import cors from 'cors';
import express from 'express';

import { env } from './config/env.js';
import { errorHandler } from './middleware/error-handler.js';
import { notFound } from './middleware/not-found.js';
import apiRouter from './routes/index.js';

export const app = express();

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

export default app;
