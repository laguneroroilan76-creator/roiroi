/**
 * sanitizePayload.middleware.js
 * Strictly protects workflow state fields from being injected via standard payload endpoints.
 */

const FORBIDDEN_FIELDS = [
  'status',
  'approvedById',
  'rejectedById',
  'verifiedById',
  'endorsedById',
  'archivedById',
  'notedById',
  'requestorId'
];

const sanitizePayload = (req, res, next) => {
  if (req.body && typeof req.body === 'object') {
    const injectedFields = Object.keys(req.body).filter(key => FORBIDDEN_FIELDS.includes(key));
    
    if (injectedFields.length > 0) {
      // Actively reject the request instead of silently stripping, as an attempted bypass is malicious
      return res.status(400).json({
        error: 'Payload Validation Error',
        message: `Attempted injection of protected workflow fields: ${injectedFields.join(', ')}`
      });
    }
  }
  next();
};

module.exports = { sanitizePayload };
