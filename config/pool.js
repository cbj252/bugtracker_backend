const { Pool } = require("pg");
const fs = require("fs");

const config = {
  ssl: {
    rejectUnauthorized: false,
    ca: fs.readFileSync("config/prod-ca-2021.crt").toString(),
  },
};

const pool = new Pool(config);

module.exports = pool;
