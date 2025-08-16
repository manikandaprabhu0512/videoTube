class ApiError extends Error {
  constructor(
    statusCode,
    message = "Something went Wrong",
    errors = [],
    stack = ""
  ) {
    super(message);
    this.statusCode = statusCode;
    this.message = message;
    this.errors = errors;
    this.sucess = false;
    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.stack);
    }
  }
}

export { ApiError };
