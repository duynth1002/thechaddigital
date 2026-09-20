let nextId = 1;

class Request {
  constructor() {
    if (new.target === Request) {
      throw new Error("Request is abstract and cannot be instantiated directly");
    }
    this._id = `req-${nextId++}`;
  }

  getId() {
    return this._id;
  }

  getFloor() {
    throw new Error("getFloor() must be implemented by subclasses");
  }

  toJSON() {
    throw new Error("toJSON() must be implemented by subclasses");
  }
}

function resetRequestIds() {
  nextId = 1;
}

module.exports = { Request, resetRequestIds };
