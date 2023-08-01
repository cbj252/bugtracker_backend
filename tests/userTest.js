const app = require("../app.js");
const request = require("supertest");
const {
  addUser,
  login_test,
  addProject,
  addTicket,
  addUserToProject,
} = require("./testHelper");
const pool = require("../config/pool");

function runTests() {
  test("/users needs authentication", async () => {
    const connection = await request(app)
      .get("/users")
      .set("Origin", "http://localhost:3000");
    expect(connection.body).toBe("No authentication included in Request.");
  });

  test("GET /users/info works.", async () => {
    await addUser("test", "manager");
    const token = await login_test("test");
    const connection = await request(app)
      .get(`/users/info`)
      .set({ authorization: token, Origin: "http://localhost:3000" });
    expect(typeof connection.text).toBe("string");
    // {} is returned if no infomation is received.
    expect(connection.text).not.toBe("{}");
  });

  test("GET /users/getTickets/assigned works (1 result).", async () => {
    const userId = await addUser("test", "manager");
    const token = await login_test("test");
    const projectId = await addProject();
    await addUserToProject(userId, projectId);
    const ticketId = await addTicket(userId, projectId);
    const connection = await request(app)
      .get(`/users/getTickets/assigned`)
      .set({ authorization: token, Origin: "http://localhost:3000" });
    expect(typeof connection.body).toBe("object");
    expect(connection.text).not.toBe("[]");
  });

  test("GET /users/getTickets/assigned works (0 results, not assigned).", async () => {
    const userId = await addUser("test", "manager");
    const otherUserId = await addUser("test2", "developer");
    const projectId = await addProject();
    await addUserToProject(userId, projectId);
    await addUserToProject(otherUserId, projectId);
    const ticketId = await addTicket(userId, projectId);
    const token = await login_test("test2");
    const connection = await request(app)
      .get(`/users/getTickets/assigned`)
      .set({ authorization: token, Origin: "http://localhost:3000" });
    expect(connection.text).toBe("[]");
  });

  test("GET /users/getTickets/all works. (1 result)", async () => {
    const userId = await addUser("test", "manager");
    const otherUserId = await addUser("test2", "developer");
    const projectId = await addProject();
    await addUserToProject(userId, projectId);
    await addUserToProject(otherUserId, projectId);
    const ticketId = await addTicket(userId, projectId);
    const token = await login_test("test2");
    const connection = await request(app)
      .get(`/users/getTickets/all`)
      .set({ authorization: token, Origin: "http://localhost:3000" });
    expect(connection.text).not.toBe("[]");
  });

  test("GET /users/view/:project_id works", async () => {
    const userId = await addUser("test", "manager");
    const token = await login_test("test");
    const projectId = await addProject();
    await addUserToProject(userId, projectId);
    const connection = await request(app)
      .get(`/users/view/${projectId}`)
      .set({ authorization: token, Origin: "http://localhost:3000" });
    expect(typeof connection.body).toBe("object");
    expect(connection.body.length).toBe(1);
  });

  test("GET /users/view/:project_id fails if logged in user is not in the project.", async () => {
    await addUser("test", "manager");
    const token = await login_test("test");
    const projectId = await addProject();
    const connection = await request(app)
      .get(`/users/view/${projectId}`)
      .set({ authorization: token, Origin: "http://localhost:3000" });
    expect(connection.body).toBe("Logged in user is not part of project.");
  });

  test("GET /users/viewnot/:project_id works (0 results)", async () => {
    const userId = await addUser("test", "manager");
    const token = await login_test("test");
    const projectId = await addProject();
    await addUserToProject(userId, projectId);
    const connection = await request(app)
      .get(`/users/viewnot/${projectId}`)
      .set({ authorization: token, Origin: "http://localhost:3000" });
    expect(connection.body).toStrictEqual([]);
  });

  test("GET /users/viewnot/:project_id works (1 result)", async () => {
    const userId = await addUser("test", "manager");
    await addUser("test2", "manager");
    const token = await login_test("test");
    const projectId = await addProject();
    await addUserToProject(userId, projectId);
    const connection = await request(app)
      .get(`/users/viewnot/${projectId}`)
      .set({ authorization: token, Origin: "http://localhost:3000" });
    expect(connection.body.length).toBe(1);
  });

  test("GET /users/viewnot/:project_id fails if logged in user is not in the project.", async () => {
    await addUser("test", "manager");
    const token = await login_test("test");
    const projectId = await addProject();
    const connection = await request(app)
      .get(`/users/viewnot/${projectId}`)
      .set({ authorization: token, Origin: "http://localhost:3000" });
    expect(connection.body).toBe("Logged in user is not part of project.");
  });
}

module.exports = runTests;
