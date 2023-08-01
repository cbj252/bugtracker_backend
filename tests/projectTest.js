const app = require("../app.js");
const request = require("supertest");
const {
  addUser,
  login_test,
  addProject,
  addUserToProject,
} = require("./testHelper");
const pool = require("../config/pool");

function runTests() {
  test("/projects needs authentication", async () => {
    const connection = await request(app)
      .get("/projects")
      .set("Origin", "http://localhost:3000");
    expect(connection.body).toBe("No authentication included in Request.");
  });

  test("GET /projects", async () => {
    const userId = await addUser("test", "manager");
    const token = await login_test("test");
    const projectId = await addProject();
    await addUserToProject(userId, projectId);
    const connection = await request(app)
      .get("/projects")
      .set({ authorization: token, Origin: "http://localhost:3000" });
    expect(typeof connection.body).toBe("object");
  });

  test("GET /projects/:id", async () => {
    const userId = await addUser("test", "manager");
    const token = await login_test("test");
    const projectId = await addProject();
    await addUserToProject(userId, projectId);
    const anotherUserId = await addUser("test2", "manager");
    await addUserToProject(anotherUserId, projectId);
    const connection = await request(app)
      .get(`/projects/${projectId}`)
      .set({ authorization: token, Origin: "http://localhost:3000" });
    expect(typeof connection.body).toBe("object");
  });

  test("POST /projects/create", async () => {
    await addUser("test", "manager");
    const token = await login_test("test");
    const connection = await request(app)
      .post("/projects/create")
      .set({ authorization: token, Origin: "http://localhost:3000" })
      .send({ title: "test_title", description: "test_description" });
    expect(typeof connection.body).toBe("number");
  });

  test("POST /projects/:id", async () => {
    const userId = await addUser("test", "manager");
    const token = await login_test("test");
    const projectId = await addProject();
    await addUserToProject(userId, projectId);
    const connectionPost = await request(app)
      .post(`/projects/${projectId}`)
      .set({ authorization: token, Origin: "http://localhost:3000" })
      .send({
        title: "new edited title",
        description: "new description",
      });
    expect(typeof connectionPost.body).toBe("object");
    const connectionGet = await request(app)
      .get(`/projects/${projectId}`)
      .set({ authorization: token, Origin: "http://localhost:3000" });
    expect(connectionGet.body[0].title).toBe("new edited title");
    expect(connectionGet.body[0].description).toBe("new description");
  });

  test("POST /projects/:project_id/add/:user_id", async () => {
    const userId = await addUser("test", "manager");
    const token = await login_test("test");
    const projectId = await addProject();
    await addUserToProject(userId, projectId);
    const otherUserId = await addUser("test2", "manager");
    const connection = await request(app)
      .post(`/projects/${projectId}/add/${otherUserId}`)
      .set({ authorization: token, Origin: "http://localhost:3000" });
    expect(typeof connection.body).toBe("number");
  });

  test("POST /projects/:project_id/add/:user_id still works even if otherUser is already in the project", async () => {
    const userId = await addUser("test", "manager");
    const token = await login_test("test");
    const projectId = await addProject();
    const otherUserId = await addUser("test2", "manager");
    await addUserToProject(userId, projectId);
    await addUserToProject(otherUserId, projectId);
    const connection = await request(app)
      .post(`/projects/${projectId}/add/${otherUserId}`)
      .set({ authorization: token, Origin: "http://localhost:3000" });
    // Returns Key (user_id, project_id)=(xxx, yyy) already exists. Frontend should accept this body.
    expect(typeof connection.body).toBe("string");
  });

  test("POST /projects/:project_id/add/:user_id still works w/ multiple projects", async () => {
    const userId = await addUser("test", "manager");
    const token = await login_test("test");
    const projectId = await addProject();
    const projectId2 = await addProject();
    await addUserToProject(userId, projectId);
    await addUserToProject(userId, projectId2);
    const otherUserId = await addUser("test2", "manager");
    const connection = await request(app)
      .post(`/projects/${projectId}/add/${otherUserId}`)
      .set({ authorization: token, Origin: "http://localhost:3000" });
    expect(typeof connection.body).toBe("number");
  });

  test("POST /projects/:project_id/add/:user_id fails if logged in user is not in the project", async () => {
    await addUser("test", "manager");
    const token = await login_test("test");
    const projectId = await addProject();
    const otherUserId = await addUser("test2", "manager");
    const connection = await request(app)
      .post(`/projects/${projectId}/add/${otherUserId}`)
      .set({ authorization: token, Origin: "http://localhost:3000" });
    expect(connection.body).toBe("Logged in user is not part of project.");
  });

  test("POST /projects/:project_id/remove/:user_id", async () => {
    const userId = await addUser("test", "manager");
    const token = await login_test("test");
    const projectId = await addProject();
    await addUserToProject(userId, projectId);
    const otherUserId = await addUser("test2", "manager");
    await addUserToProject(otherUserId, projectId);
    const connection = await request(app)
      .post(`/projects/${projectId}/remove/${otherUserId}`)
      .set({ authorization: token, Origin: "http://localhost:3000" });
    expect(typeof connection.body).toBe("number");
  });
}

module.exports = runTests;
