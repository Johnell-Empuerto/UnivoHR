const errorHandler = (err, req, res, next) => {
  const isProduction = process.env.NODE_ENV === "production";

  // Always log server-side
  console.error(isProduction ? `Error: ${err.message}` : err.stack);

  res.status(err.status || 500).json({
    message: err.message || "Internal Server Error",
    ...(isProduction ? {} : { stack: err.stack }),
  });
};

module.exports = errorHandler;
