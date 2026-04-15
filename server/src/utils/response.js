/**
 * Standard API response helpers
 */

function success(res, data = {}, statusCode = 200) {
  return res.status(statusCode).json({ success: true, ...data });
}

function created(res, data = {}) {
  return success(res, data, 201);
}

function noContent(res) {
  return res.status(204).end();
}

function error(res, message = 'Internal server error', statusCode = 500, details = null) {
  const body = { success: false, message };
  if (details) body.details = details;
  return res.status(statusCode).json(body);
}

function notFound(res, message = 'Resource not found') {
  return error(res, message, 404);
}

function badRequest(res, message = 'Bad request', details = null) {
  return error(res, message, 400, details);
}

function unauthorized(res, message = 'Unauthorized') {
  return error(res, message, 401);
}

function forbidden(res, message = 'Forbidden') {
  return error(res, message, 403);
}

module.exports = { success, created, noContent, error, notFound, badRequest, unauthorized, forbidden };
