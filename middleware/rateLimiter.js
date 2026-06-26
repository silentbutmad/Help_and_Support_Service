import rateLimit from "express-rate-limit"

const createRateLimiter = (windowMs, max, message) => {
  return rateLimit({
    windowMs: windowMs || parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
    max: max || parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
    message: {
      success: false,
      message: message || 'Too many requests, please try again later'
    },
    standardHeaders: true,
    legacyHeaders: false
  });
};

const generalLimiter = createRateLimiter();
const authLimiter = createRateLimiter(
  15 * 60 * 1000,
  5,
  'Too many authentication attempts, please try again after 15 minutes'
);
const ticketLimiter = createRateLimiter(
  15 * 60 * 1000,
  20,
  'Too many ticket requests, please try again later'
);

export {
  generalLimiter,
  authLimiter,
  ticketLimiter
};