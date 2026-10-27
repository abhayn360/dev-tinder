// The backend always sends errors as { success: false, error: { message, details } }.
// These helpers turn that into something the UI can show.

export function getErrorMessage(error) {
  if (!error) return '';
  if (!error.response) return 'Cannot reach the server. Is the backend running?';
  return error.response.data?.error?.message ?? 'Something went wrong';
}

// [{ field: 'emailId', message: 'Invalid email' }] -> { emailId: 'Invalid email' }
export function getFieldErrors(error) {
  const details = error?.response?.data?.error?.details ?? [];
  const fieldErrors = {};
  for (const { field, message } of details) {
    fieldErrors[field] ??= message; // keep the first message per field
  }
  return fieldErrors;
}
