// Every successful response has the same shape, so the frontend always knows
// where to look:  { success: true, message, data }
function sendSuccess(res, { statusCode = 200, message = 'OK', data = null } = {}) {
  return res.status(statusCode).json({ success: true, message, data });
}

module.exports = { sendSuccess };
