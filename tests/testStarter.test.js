const app = require("../app");
const { deleteAll } = require("./testHelper");
const pool = require("../config/pool");

beforeAll(async () => {
  process.env.PGHOST = process.env.TESTHOST;
  process.env.PGPASSWORD = process.env.TESTPASSWORD;
});

beforeEach(async () => {
  await deleteAll(pool);
});

afterAll(async () => {
  app.closeServer();
  await pool.end();
});

require("./authTest.js")();
require("./projectTest.js")();
require("./userTest.js")();
require("./ticketTest.js")();
