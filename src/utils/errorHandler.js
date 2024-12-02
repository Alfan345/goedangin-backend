const errorHandler = (h, error, defaultMessage = "Terjadi kesalahan") => {
  console.error("Error:", error.message); // Log error untuk debugging
  return h
    .response({ message: defaultMessage, error: error.message })
    .code(500);
};

module.exports = { errorHandler };
