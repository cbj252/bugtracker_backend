/*
router.post("/login", authController.login);
router.post("/signup/manager", authController.signupManager);
router.post("/signup/developer", authController.signupDev);
*/

const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const pool = require("../config/pool");

exports.login = function (req, res) {
  const query = {
    text: "SELECT * FROM users WHERE username = $1",
    values: [req.body.username],
  };

  pool
    .query(query)
    .then((result) =>
      result.rows.length === 1
        ? bcrypt.compare(
            req.body.password,
            result.rows[0].password,
            function (err, passwordMatch) {
              if (err) {
                return res.json("Database error - Comparing Bcrypt tokens.");
              }
              if (passwordMatch) {
                jwt.sign(
                  { id: result.rows[0].id },
                  "secretKey",
                  (err, token) => {
                    if (err) {
                      return res.json(err);
                    }
                    return res.json({ token });
                  }
                );
              } else {
                return res.json("Incorrect password.");
              }
            }
          )
        : result.rows.length === 0
        ? res.json("Incorrect username.")
        : res.json("Database error - Multiple users with the username found.")
    )
    .catch((e) => res.json(e.detail));
};

exports.signupManager = function (req, res) {
  bcrypt.hash(req.body.password, 10, (err, hashedPassword) => {
    if (err) {
      res.json("Hashing error.");
    } else {
      const query = {
        text: "INSERT INTO users(username, password, type) VALUES($1, $2, $3) RETURNING id",
        values: [req.body.username, hashedPassword, "manager"],
      };
      pool
        .query(query)
        .then((response) => {
          if (typeof response.rows[0].id != "number") {
            return res.json(response.rows[0].id);
          } else {
            jwt.sign({ id: response.rows[0].id }, "secretKey", (err, token) => {
              if (err) {
                return res.json(err);
              }
              return res.json({ token });
            });
          }
        })
        .catch((e) => res.json(e.detail));
      // Returns "Key (username)=(the username given) already exists." if user puts a duplicate username.
    }
  });
};

exports.signupDev = function (req, res) {
  bcrypt.hash(req.body.password, 10, (err, hashedPassword) => {
    if (err) {
      res.json("Hashing error.");
    } else {
      const query = {
        text: "INSERT INTO users(username, password, type) VALUES($1, $2, $3) RETURNING id",
        values: [req.body.username, hashedPassword, "developer"],
      };
      pool
        .query(query)
        .then((response) => {
          if (typeof response.rows[0].id != "number") {
            return res.json(response.rows[0].id);
          } else {
            jwt.sign({ id: response.rows[0].id }, "secretKey", (err, token) => {
              if (err) {
                return res.json(err);
              }
              return res.json({ token });
            });
          }
        })
        .catch((e) => res.json(e.detail));
      // Returns "Key (username)=(the username given) already exists." if user puts a duplicate username.
    }
  });
};
