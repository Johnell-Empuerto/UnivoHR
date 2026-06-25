const validate = require("../middleware/validate.middleware");

describe("validate.middleware", () => {
  let req, res, next;

  beforeEach(() => {
    req = { body: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
  });

  it("calls next() when body passes validation", () => {
    const schema = {
      validate: jest.fn().mockReturnValue({ error: undefined }),
    };
    const handler = validate(schema);

    handler(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });

  it("returns 400 with error message when body is invalid", () => {
    const schema = {
      validate: jest.fn().mockReturnValue({
        error: {
          details: [{ message: '"email" is required' }],
        },
      }),
    };
    const handler = validate(schema);

    handler(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: '"email" is required',
    });
  });

  it("only validates req.body, not query or params", () => {
    const schema = {
      validate: jest.fn().mockReturnValue({ error: undefined }),
    };
    req.query = { filter: "all" };
    req.params = { id: "5" };
    const handler = validate(schema);

    handler(req, res, next);

    expect(schema.validate).toHaveBeenCalledWith(req.body);
    expect(schema.validate).not.toHaveBeenCalledWith(req.query);
    expect(schema.validate).not.toHaveBeenCalledWith(req.params);
  });

  it("does not mutate req.body when validation passes", () => {
    const schema = {
      validate: jest.fn().mockReturnValue({ error: undefined, value: { name: "John" } }),
    };
    req.body = { name: "John" };
    const handler = validate(schema);

    handler(req, res, next);

    expect(req.body).toEqual({ name: "John" });
  });

  it("handles Joi error with multiple details and picks first message", () => {
    const schema = {
      validate: jest.fn().mockReturnValue({
        error: {
          details: [
            { message: '"email" is required' },
            { message: '"password" must be at least 8 characters' },
          ],
        },
      }),
    };
    const handler = validate(schema);

    handler(req, res, next);

    expect(res.json).toHaveBeenCalledWith({
      message: '"email" is required',
    });
  });

  it("handles null body gracefully", () => {
    req.body = null;
    const schema = {
      validate: jest.fn().mockReturnValue({
        error: {
          details: [{ message: '"value" must be an object' }],
        },
      }),
    };
    const handler = validate(schema);

    handler(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
  });
});
