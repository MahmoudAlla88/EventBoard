// Small helper so controllers can throw an error with a specific HTTP status.
// e.g. throw new ApiError(404, 'Event not found')
class ApiError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
  }
}

// Central error handler. Keeps controllers free of try/catch status-code logic.
// Must be registered last, after all routes.
function errorHandler(err, req, res, next) { // eslint-disable-line no-unused-vars
  // Explicit ApiError thrown by a controller.
  if (err.statusCode) {
    return res.status(err.statusCode).json({ error: err.message });
  }

  // Mongoose validation error (missing/invalid required fields).
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors)
      .map((e) => e.message)
      .join(', ');
    return res.status(400).json({ error: message });
  }

  // Malformed ObjectId in a route param like /api/events/:id.
  if (err.name === 'CastError') {
    return res.status(400).json({ error: `Invalid ${err.path}: ${err.value}` });
  }

  // Duplicate key, e.g. the same user registering twice for the same event.
  if (err.code === 11000) {
    return res.status(409).json({ error: 'Duplicate entry', details: err.keyValue });
  }

  console.error(err);
  return res.status(500).json({ error: 'Internal server error' });
}

module.exports = { errorHandler, ApiError };
