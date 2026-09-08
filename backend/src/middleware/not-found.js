import { createHttpError } from '../utils/http-error.js';

export function notFound(req, res, next) {
  next(createHttpError(404, `Route not found: ${req.method} ${req.originalUrl}`));
}

export default {
  notFound,
};
