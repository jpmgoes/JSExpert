const assert = require("node:assert");
const { describe, it, before, afterEach } = require("mocha");
const { createSandbox, SinonSpy } = require("sinon");
const Pagination = require("../src/pagination");
const Request = require("../src/request");

describe("Pagination tests", () => {
  let sandbox = createSandbox();

  before(() => {
    sandbox = createSandbox();
  });

  afterEach(() => sandbox.restore());

  describe("#Pagination", () => {
    describe("instance", () => {
      it("should have default options on Pagination instance", () => {
        const pagination = new Pagination();
        const expectedProperties = {
          maxRetries: 4,
          retryTimeout: 1000,
          maxRequestTimeout: 1000,
          threshold: 200,
        };

        assert.ok(pagination.request instanceof Request);
        Reflect.deleteProperty(pagination, "request");

        function getEntries(item) {
          return Object.entries(item);
        }

        assert.deepStrictEqual(
          getEntries(pagination),
          getEntries(expectedProperties),
        );
      });

      it("should have default options on Pagination instance 2", () => {
        const params = {
          maxRetries: 4,
          retryTimeout: 1000,
          maxRequestTimeout: 1000,
          threshold: 200,
        };

        const pagination = new Pagination(params);
        const expectedProperties = {
          request: {},
          ...params,
        };

        assert.ok(pagination.request instanceof Request);
        assert.deepStrictEqual(
          JSON.stringify(pagination),
          JSON.stringify(expectedProperties),
        );
      });
    });

    describe("#sleep", () => {
      it("should be a promise and not return values", async () => {
        const clock = sandbox.useFakeTimers();
        const time = 1;
        const pendingPromise = Pagination.sleep(time);
        clock.tick(time);

        assert.ok(pendingPromise instanceof Promise);

        const result = await pendingPromise;
        assert.ok(result === undefined);
      });
    });

    describe("#handleRequest", () => {
      it("should retry a request twice before throing an exception and validate request params and flow", async () => {
        const expectedCallCount = 2;
        const expectedTimeout = 10;

        const pagination = new Pagination();
        pagination.maxRetries = expectedCallCount;
        pagination.retryTimeout = expectedTimeout;
        pagination.maxRequestTimeout = expectedTimeout;

        const error = new Error("timeout");
        sandbox.spy(pagination, pagination.handleRequest.name);
        sandbox.stub(Pagination, Pagination.sleep.name).resolves();
        sandbox
          .stub(pagination.request, pagination.request.makeRequest.name)
          .rejects(error);

        const dataRequest = { url: "https://google.com", page: 0 };
        await assert.rejects(pagination.handleRequest(dataRequest), error);
        assert.deepStrictEqual(
          pagination.handleRequest.callCount,
          expectedCallCount,
        );

        /**
         * @description
         * pegue por chamada, no caso o 1 é a segunda chamada,
         * 0 sendo a primeira, como tem que tentar 2x, a segunda request é a última
         * */
        const lastCall = 1;
        const firstCallArg =
          pagination.handleRequest.getCall(lastCall).firstArg;
        const firstCallRetries = firstCallArg.retries;
        assert.deepStrictEqual(firstCallRetries, expectedCallCount);

        const expectedArgs = {
          method: "get",
          timeout: expectedTimeout,
          url: `${dataRequest.url}?tid=${dataRequest.page}`,
        };

        const firstCallArgs = pagination.request.makeRequest.getCall(0).args;
        assert.deepStrictEqual(firstCallArgs, [expectedArgs]);

        assert.ok(Pagination.sleep.calledWithExactly(expectedTimeout));
      });

      it("should return data from request when succedded", async () => {
        const data = { result: "ok" };
        const pagination = new Pagination();
        sandbox
          .stub(pagination.request, pagination.request.makeRequest.name)
          .resolves(data);

        const result = await pagination.handleRequest({
          url: "https://google.com",
          page: 1,
        });

        assert.deepStrictEqual(result, data);
      });
    });

    describe("#getPaginated", () => {
      const responseMock = [
        {
          amount: 11.61235446,
          date: 1373033481,
          price: 200.60001,
          tid: 5556,
          type: "sell",
        },
        {
          amount: 3.14739453,
          date: 1373033481,
          price: 200.021,
          tid: 5557,
          type: "sell",
        },
      ];

      it("should update request id on each request", async () => {
        const pagination = new Pagination();
        sandbox.stub(Pagination, Pagination.sleep.name).resolves();
        sandbox
          .stub(pagination, pagination.handleRequest.name)
          .onCall(0)
          .resolves([responseMock[0]])
          .onCall(1)
          .resolves([responseMock[1]])
          .onCall(2)
          .resolves([]);

        sandbox.spy(pagination, pagination.getPaginated.name);

        const data = { url: "https://google.com", page: 1 };

        const secondCallExpectation = {
          ...data,
          page: responseMock[0].tid,
        };

        const thirdCallExpectation = {
          ...data,
          page: responseMock[1].tid,
        };

        function getFirstArgFromCall(value) {
          return pagination.handleRequest.getCall(value).firstArg;
        }

        const gen = pagination.getPaginated(data);
        for await (const result of gen) {
          console.log("page", result);
        }

        assert.deepStrictEqual(getFirstArgFromCall(0), data);
        assert.deepStrictEqual(getFirstArgFromCall(1), secondCallExpectation);
        assert.deepStrictEqual(getFirstArgFromCall(2), thirdCallExpectation);
      });

      it("should stop requesting when request return an empty array", async () => {
        const expectedThreshold = 20;
        const pagination = new Pagination();
        pagination.threshold = expectedThreshold;
        sandbox.stub(Pagination, Pagination.sleep.name).resolves();
        sandbox
          .stub(pagination, pagination.handleRequest.name)
          .onCall(0)
          .resolves([responseMock[0]])
          .onCall(1)
          .resolves([]);

        sandbox.spy(pagination, pagination.getPaginated.name);

        const data = { url: "https://google.com", page: 1 };

        const iterator = await pagination.getPaginated(data);

        const [firstResult, secondResult] = await Promise.all([
          iterator.next(),
          iterator.next(),
        ]);

        const expectedFirstCall = { done: false, value: [responseMock[0]] };
        assert.deepStrictEqual(firstResult, expectedFirstCall);

        /**@description
         * O done true e value undefined quando a lista é vazia, pois o getPaginated
         * retorna nada quando o length === 0
         * */
        const expectedSecondCall = { done: true, value: undefined };
        assert.deepStrictEqual(secondResult, expectedSecondCall);

        assert.deepStrictEqual(Pagination.sleep.callCount, 1);
        assert.ok(Pagination.sleep.calledWithExactly(expectedThreshold));
      });
    });
  });
});
