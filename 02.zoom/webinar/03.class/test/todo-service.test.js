const { describe, it, before, afterEach, beforeEach } = require("mocha");
const { expect } = require("chai");
const { createSandbox, replace } = require("sinon");

const TodoService = require("../src/todo.service");
const Todo = require("../src/todo");

describe("todoService", () => {
  let sandbox = createSandbox();

  before(() => {
    sandbox = createSandbox();
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe("#create", () => {
    let todoService;
    beforeEach(() => {
      const dependencies = {
        todoRepository: {
          create: sandbox.stub().returns(true),
        },
      };

      todoService = new TodoService(dependencies);
    });

    it("sould not save todo item with invalid data", () => {
      const data = new Todo({
        text: "",
        when: "",
      });

      Reflect.deleteProperty(data, "id");

      const expected = {
        error: {
          message: "invalid data",
          data,
        },
      };

      const result = todoService.create(data);
      expect(result).to.be.deep.equal(expected);
    });

    it("sould save todo item with late status when the property is futher than today", () => {
      const properties = {
        text: "I must walk my dog",
        when: new Date("2020-12-01 12:00:00"),
      };

      const expectedId = "000001";
      // const uuid = require("uuid");
      // sandbox.stub(uuid, "v4").returns(expectedId);
      // const fakerUUID = sandbox.fake.returns(expectedId);
      // sandbox.replaceGetter(uuid, "v4", fakerUUID);

      const data = new Todo(properties);
      data.id = expectedId;

      const today = new Date("2020-12-02");
      sandbox.useFakeTimers(today.getTime());

      todoService.create(data);

      const expectedCallWith = {
        ...data,
        status: "late",
      };

      expect(
        todoService.todoRepository.create.calledOnceWithExactly(
          expectedCallWith,
        ),
      ).to.be.ok;
    });

    it("sould save todo item with pending status", () => {
      const properties = {
        text: "I must walk my dog",
        when: new Date("2020-12-01 12:00:00"),
      };

      const expectedId = "000001";
      const data = new Todo(properties);
      data.id = expectedId;

      const today = new Date("2020-10-02");
      sandbox.useFakeTimers(today.getTime());

      todoService.create(data);

      const expectedCallWith = {
        ...data,
        status: "pending",
      };

      expect(
        todoService.todoRepository.create.calledOnceWithExactly(
          expectedCallWith,
        ),
      ).to.be.ok;
    });
  });

  describe("#list", () => {
    const mockDatabase = [
      {
        name: "JP",
        age: 90,
        meta: { revision: 0, created: 1710294323315, version: 0 },
        $loki: 1,
      },
    ];

    let todoService;
    beforeEach(() => {
      const dependencies = {
        todoRepository: {
          list: sandbox.stub().returns(mockDatabase),
        },
      };

      todoService = new TodoService(dependencies);
    });

    it("sould return data on a specific format", () => {
      const result = todoService.list();
      const [{ meta, $loki, ...expected }] = mockDatabase;
      expect(result).to.be.deep.equal([expected]);
    });
  });
});
