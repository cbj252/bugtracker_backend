const app = require("../app.js");
const request = require("supertest");
const { addUser } = require("./testHelper");
const pool = require("../config/pool");

function runTests() {
  test("GET /auth/login Works", async () => {
    await addUser("test", "manager");
    const login = await request(app)
      .post("/auth/login")
      .set("Origin", "http://localhost:3000")
      .send({
        username: "test",
        password: "password",
      });
    expect(login.body.token !== undefined).toBe(true);
  });

  test("POST /auth/signup/manager + Login Works", async () => {
    const signUp = await request(app)
      .post("/auth/signup/manager")
      .set("Origin", "http://localhost:3000")
      .send({
        username: "test",
        password: "password",
      });
    expect(typeof signUp.body.token).toBe("string");
    const login = await request(app)
      .post("/auth/login")
      .set("Origin", "http://localhost:3000")
      .send({
        username: "test",
        password: "password",
      });
    expect(login.body.token !== undefined).toBe(true);
  });

  test("POST /auth/signup/developer + Login Works", async () => {
    const signUp = await request(app)
      .post("/auth/signup/developer")
      .set("Origin", "http://localhost:3000")
      .send({
        username: "test",
        password: "password",
      });
    expect(typeof signUp.body.token).toBe("string");
    const login = await request(app)
      .post("/auth/login")
      .set("Origin", "http://localhost:3000")
      .send({
        username: "test",
        password: "password",
      });
    expect(login.body.token !== undefined).toBe(true);
  });

  test("Duplicate Signups on POST /auth/signup/manager give an error.", async () => {
    const signUp = await request(app)
      .post("/auth/signup/developer")
      .set("Origin", "http://localhost:3000")
      .send({
        username: "test",
        password: "password",
      });
    expect(typeof signUp.body.token).toBe("string");
    const dupSignUp = await request(app)
      .post("/auth/signup/developer")
      .set("Origin", "http://localhost:3000")
      .send({
        username: "test",
        password: "password_2",
      });
    expect(dupSignUp.body).toBe("Key (username)=(test) already exists.");
  });
}

module.exports = runTests;
