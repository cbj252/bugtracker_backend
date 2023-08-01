const app = require("../app.js");
const request = require("supertest");
const {
  deleteAll,
  addUser,
  login_test,
  addProject,
  addTicket,
  addUserToProject,
  exampleTicket,
} = require("./testHelper");
const pool = require("../config/pool");

function runTests() {
  test("/tickets needs authentication", async () => {
    const connection = await request(app)
      .get("/tickets")
      .set("Origin", "http://localhost:3000");
    expect(connection.body).toBe("No authentication included in Request.");
  });

  test("GET /tickets/:project_id", async () => {
    const userId = await addUser("test", "manager");
    const token = await login_test("test");
    const projectId = await addProject();
    await addUserToProject(userId, projectId);
    const ticketId = await addTicket(userId, projectId);
    const connection = await request(app)
      .get(`/tickets/${projectId}`)
      .set({ authorization: token, Origin: "http://localhost:3000" });
    expect(typeof connection.body).toBe("object");
  });

  test("GET /tickets/:project_id/:ticket_id", async () => {
    const userId = await addUser("test", "manager");
    const token = await login_test("test");
    const projectId = await addProject();
    await addUserToProject(userId, projectId);
    const ticketId = await addTicket(userId, projectId);
    const connection = await request(app)
      .get(`/tickets/${projectId}/${ticketId}`)
      .set({ authorization: token, Origin: "http://localhost:3000" });
    expect(typeof connection.body).toBe("object");
  });

  test("GET /tickets/:project_id/:ticket_id/history + POST /tickets/:project_id/:ticket_id", async () => {
    const userId = await addUser("test", "manager");
    const token = await login_test("test");
    const projectId = await addProject();
    await addUserToProject(userId, projectId);
    const ticketId = await addTicket(userId, projectId);
    const connection = await request(app)
      .post(`/tickets/${projectId}/${ticketId}`)
      .set({ authorization: token, Origin: "http://localhost:3000" })
      .send(exampleTicket(userId));
    expect(connection.body).toBe("Completed.");
    const historyValues = await request(app)
      .get(`/tickets/${projectId}/${ticketId}/history`)
      .set({ authorization: token, Origin: "http://localhost:3000" });
    expect(historyValues.body.length).toBe(2);
  });

  test("GET /tickets/:project_id/:ticket_id/comment + POST /tickets/:project_id/:ticket_id/comment", async () => {
    const userId = await addUser("test", "manager");
    const token = await login_test("test");
    const projectId = await addProject();
    await addUserToProject(userId, projectId);
    const ticketId = await addTicket(userId, projectId);
    const connection = await request(app)
      .post(`/tickets/${projectId}/${ticketId}/comment`)
      .set({ authorization: token, Origin: "http://localhost:3000" })
      .send({
        comment: "test comment",
      });
    expect(typeof connection.body).toBe("object");
    expect(typeof connection.body.id).toBe("number");
    const commentValues = await request(app)
      .get(`/tickets/${projectId}/${ticketId}/comments`)
      .set({ authorization: token, Origin: "http://localhost:3000" });
    expect(commentValues.body.length).toBe(1);
  });

  test("POST /tickets/:project_id/create", async () => {
    const userId = await addUser("test", "manager");
    const token = await login_test("test");
    const projectId = await addProject();
    await addUserToProject(userId, projectId);
    const connection = await request(app)
      .post(`/tickets/${projectId}/create`)
      .set({ authorization: token, Origin: "http://localhost:3000" })
      .send(exampleTicket(userId));
    expect(typeof connection.body).toBe("object");
    expect(typeof connection.body.id).toBe("number");
  });

  test("POST /tickets/:project_id/:ticket_id fails if ticket is not in project", async () => {
    const userId = await addUser("test", "manager");
    const token = await login_test("test");
    const projectId = await addProject();
    const projectId2 = await addProject();
    await addUserToProject(userId, projectId2);
    const ticketId = await addTicket(userId, projectId);
    const connection = await request(app)
      .post(`/tickets/${projectId2}/${ticketId}`)
      .set({ authorization: token, Origin: "http://localhost:3000" })
      .send({
        title: "new edited title",
        ticket_prio: "medium",
        type: "Bug/Error",
      });
    expect(connection.body).toBe("Ticket is not part of project.");
  });

  test("POST /tickets/:project_id/:ticket_id/comment fails if ticket is not in project", async () => {
    const userId = await addUser("test", "manager");
    const token = await login_test("test");
    const projectId = await addProject();
    const projectId2 = await addProject();
    await addUserToProject(userId, projectId2);
    const ticketId = await addTicket(userId, projectId);
    const connection = await request(app)
      .post(`/tickets/${projectId2}/${ticketId}/comment`)
      .set({ authorization: token, Origin: "http://localhost:3000" })
      .send({
        comment: "test comment",
      });
    expect(connection.body).toBe("Ticket is not part of project.");
  });
}

module.exports = runTests;
