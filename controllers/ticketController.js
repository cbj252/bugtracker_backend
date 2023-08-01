/*
router.get("/:project_id", ticketController.getTicketsInProject);
router.get("/:project_id/:ticket_id", ticketController.getTicket);
router.get("/:project_id/:ticket_id/comments", ticketController.getTicketComments);
router.get("/:project_id/:ticket_id/history", ticketController.getTicketHistory);
router.post("/:project_id/create", ticketController.createTicket);
router.post("/:project_id/:ticket_id", ticketController.editTicket);
router.post(
  "/:project_id/:ticket_id/comment",
  ticketController.commentOnTicket
);
*/

const pool = require("../config/pool");
const {
  isUserInProject,
  isTicketInProject,
  idToUsername,
} = require("./helper.js");

exports.getTicketsInProject = async function (req, res) {
  if (await isUserInProject(res.locals.currentUser_id, req.params.project_id)) {
    const query = {
      text: `SELECT tickets.id, title, ticket_prio, tickets.type, time, username FROM tickets 
      INNER JOIN users on tickets.developer = users.id 
      WHERE project = ($1);`,
      values: [req.params.project_id],
    };
    pool
      .query(query)
      .then((response) => res.json(response.rows))
      .catch((e) => res.json(e.detail));
  } else {
    res.json("Logged in user is not part of project.");
  }
};

exports.getTicket = async function (req, res) {
  if (await isUserInProject(res.locals.currentUser_id, req.params.project_id)) {
    const query = {
      text: `SELECT projects.title as project, tickets.title, tickets.description, 
      ticket_prio, status, tickets.type, time, developer, username 
      FROM tickets 
      INNER JOIN users on tickets.developer = users.id 
      INNER JOIN projects on project = projects.id
      WHERE tickets.id = ($1)`,
      values: [req.params.ticket_id],
    };
    pool
      .query(query)
      .then((response) =>
        response.rows.length === 1
          ? res.json(response.rows[0])
          : response.rows.length === 0
          ? res.json("Ticket not found.")
          : res.json("Multiple tickets found.")
      )
      .catch((e) => res.json(e.detail));
  } else {
    res.json("Logged in user is not part of project ticket is from.");
  }
};

exports.getTicketComments = async function (req, res) {
  if (await isUserInProject(res.locals.currentUser_id, req.params.project_id)) {
    const query = {
      text: "SELECT username, comment, time FROM comments INNER JOIN users ON commenter = users.id WHERE ticket = ($1);",
      values: [req.params.ticket_id],
    };
    pool
      .query(query)
      .then((response) => {
        res.json(response.rows);
      })
      .catch((e) => res.json(e.detail));
  } else {
    res.json("Logged in user is not part of project ticket is from.");
  }
};

exports.getTicketHistory = async function (req, res) {
  if (await isUserInProject(res.locals.currentUser_id, req.params.project_id)) {
    const query = {
      text: "SELECT field, old_val, new_val, time FROM history WHERE ticket = ($1);",
      values: [req.params.ticket_id],
    };
    pool
      .query(query)
      .then((response) => res.json(response.rows))
      .catch((e) => res.json(e.detail));
  } else {
    res.json("Logged in user is not part of project ticket is from.");
  }
};

exports.createTicket = async function (req, res) {
  if (await isUserInProject(res.locals.currentUser_id, req.params.project_id)) {
    const query = {
      text: `INSERT INTO tickets(title, description, ticket_prio, status, type, project, developer, time) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8) returning *`,
      values: [
        req.body.title,
        req.body.description,
        req.body.ticket_prio,
        req.body.status,
        req.body.type,
        req.params.project_id,
        req.body.developer,
        new Date(),
      ],
    };

    pool
      .query(query)
      .then(async (response) => {
        io.to("User" + req.body.developer)
          .except("User" + res.locals.currentUser_id)
          .emit("ticketOpenedAssigned", response.rows[0]);
        io.to("Project" + req.params.project_id)
          .except("User" + res.locals.currentUser_id)
          .except("User" + req.body.developer)
          .emit("ticketOpenedTeam", response.rows[0]);
        res.json(response.rows[0]);
      })
      .catch((e) => res.json(e.detail));
  } else {
    res.json("Logged in user is not part of project ticket is from.");
  }
};

exports.editTicket = async function (req, res) {
  const editTime = new Date();
  function writeHistory(field, oldVal, newVal) {
    if (!(oldVal === newVal)) {
      const query = {
        text: "INSERT INTO history(ticket, field, old_val, new_val, time) VALUES ($1, $2, $3, $4, $5)",
        values: [req.params.ticket_id, field, oldVal, newVal, editTime],
      };
      return pool.query(query).catch((e) => res.json(e.detail));
    }
  }

  async function writeHistoryHelper(oldVal) {
    await writeHistory("Title", oldVal.title, req.body.title);
    await writeHistory("Description", oldVal.description, req.body.description);
    await writeHistory(
      "Ticket Priority",
      oldVal.ticket_prio,
      req.body.ticket_prio
    );
    await writeHistory("Status", oldVal.status, req.body.status);
    await writeHistory("Type", oldVal.type, req.body.type);
    await writeHistory(
      "Developer",
      await idToUsername(oldVal.developer),
      await idToUsername(req.body.developer)
    );
    res.json("Completed.");
  }

  if (await isUserInProject(res.locals.currentUser_id, req.params.project_id)) {
    if (await isTicketInProject(req.params.ticket_id, req.params.project_id)) {
      const query = {
        text: `UPDATE tickets SET title = ($1), description = ($2), ticket_prio = ($3), 
        status = ($4), type = ($5), developer = ($6) 
        FROM (SELECT * FROM tickets WHERE tickets.id = ($7) FOR UPDATE) y WHERE tickets.id = y.id RETURNING y.*`,
        values: [
          req.body.title,
          req.body.description,
          req.body.ticket_prio,
          req.body.status,
          req.body.type,
          req.body.developer,
          req.params.ticket_id,
        ],
      };
      pool
        .query(query)
        .then(function (response) {
          if (response.rows.length === 1) {
            writeHistoryHelper(response.rows[0]);
            if (
              response.rows[0].status !== "Closed" &&
              req.body.status === "Closed"
            ) {
              io.to("User" + req.body.developer)
                .except("User" + res.locals.currentUser_id)
                .emit("ticketClosed", {
                  title: req.body.title,
                  project: req.params.project_id,
                  id: req.params.ticket_id,
                });
              io.to("Project" + req.params.project_id)
                .except("User" + res.locals.currentUser_id)
                .except("User" + req.body.developer)
                .emit("ticketClosed", {
                  title: req.body.title,
                  project: req.params.project_id,
                  id: req.params.ticket_id,
                });
            }
          } else if (response.rows.length === 0) {
            res.json(`editTicket error - No tickets returned.`);
          } else {
            res.json(`editTicket error - Multiple tickets returned.`);
          }
        })
        .catch((e) => res.json(e.detail));
    } else {
      res.json("Ticket is not part of project.");
    }
  } else {
    res.json("Logged in user is not part of project ticket is from.");
  }
};

exports.commentOnTicket = async function (req, res) {
  if (await isUserInProject(res.locals.currentUser_id, req.params.project_id)) {
    if (await isTicketInProject(req.params.ticket_id, req.params.project_id)) {
      const query = {
        text: "INSERT INTO comments(comment, commenter, ticket, time) VALUES ($1, $2, $3, $4) returning id",
        values: [
          req.body.comment,
          res.locals.currentUser_id,
          req.params.ticket_id,
          new Date(),
        ],
      };

      pool
        .query(query)
        .then((response) => res.json(response.rows[0]))
        .catch((e) => res.json(e.detail));
    } else {
      res.json("Ticket is not part of project.");
    }
  } else {
    res.json("Logged in user is not part of project ticket is from.");
  }
};
