const ValidationError = require("../utils/ValidationError");

describe("ValidationError", () => {
  it("is an instance of Error", () => {
    const err = new ValidationError("Invalid input");
    expect(err).toBeInstanceOf(Error);
  });

  it("is an instance of ValidationError", () => {
    const err = new ValidationError("Invalid input");
    expect(err).toBeInstanceOf(ValidationError);
  });

  it("has status 400", () => {
    const err = new ValidationError("Invalid input");
    expect(err.status).toBe(400);
  });

  it("stores the message", () => {
    const err = new ValidationError("Something is wrong");
    expect(err.message).toBe("Something is wrong");
  });

  it("can be thrown and caught", () => {
    const fn = () => {
      throw new ValidationError("test error");
    };
    expect(fn).toThrow(ValidationError);
    expect(fn).toThrow("test error");
  });

  it("has the correct name property", () => {
    const err = new ValidationError("clean");
    expect(err.name).toBe("ValidationError");
  });
});
