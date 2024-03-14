// https://www.mercadobitcoin.net/api/btc/trades/?tid=5704
const Pagination = require("./pagination");
const Request = require("./request");

const request = new Request();

async function main() {
  console.log("staring in...", new Date().toISOString());
  const requests = [
    { url: "https://www.mercadobitcoin.net/api/BTC/ticker" },
    { url: "https://www.mercadobitcoin.net/api/BTC/orderbook" },
  ]
    .map((data) => {
      return {
        ...data,
        timeout: 2000,
        method: "get",
      };
    })
    .map((params) => request.makeRequest(params));

  const results = await Promise.allSettled(requests);
  const succeded = [];
  const failded = [];
  for (const { status, value, reason } of results) {
    if (status === "rejected") {
      failded.push(reason);
      continue;
    }

    succeded.push(value);
  }

  console.log(failded, succeded);

  console.log("Pagination ---------------");
  const pagination = new Pagination();
  const firstPage = 770e3;
  const req = pagination.getPaginated({
    url: "https://www.mercadobitcoin.net/api/BTC/trades/",
    page: firstPage,
  });

  for await (const items of req) {
    console.table(items);
  }
}

main();
