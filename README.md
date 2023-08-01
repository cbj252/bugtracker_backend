# Bug Tracker Website (Backend)

This is a bug tracker that helps users to monitor bugs, using the standard tickets system, where bugs are represented as tickets to be handled.
It was created as a pair project with Li Yifei.

The frontend can be found [here](https://github.com/cbj252/bugtracker/tree/main).
The website hosting this code can be found [here](https://bugtrackerplus.vercel.app/).

# Features

- Users can signup for an account with a username, password and user type, Developer or Project Manager.

For logged in users:

- Users can see all tickets that warrant their attention (open tickets assigned to them for developers, all open tickets for managers) in the dashboard.
- Users can see a table and doughnut chart of the tickets that warrant their attention.
- Project Managers can create projects.
- Users can add users to projects and edit projects.
- Project managers can delete users from projects, except themselves.
- Users can create and edit tickets. All edits to tickets are kept track of via a history system.
- Users can make comments to tickets.
- Users can upload files to tickets that can be previewed or downloaded.
- Users can upload an image to use as their avatar. This image will be seen by other users.
- Users will receive a notification when someone else changes the state of a ticket, such as from Open to Closed, that warrants their attention.

# Project Structure & Reasoning

- Backend is separated into various routes, depending on the type of data the route is handling. For example, the /projects route includes all requests regarding projects. Each route is linked to a controller that handles all requests to that route and returns the appropriate data.
- Tests are done on a per-controller basis, with each controller getting a file that contains all tests involving it. This structure allows for easy testing of only one controller at a time. Given the small size of the project, all tests are usually [run regardless](https://github.com/cbj252/bugtracker_backend/blob/main/tests/testStarter.test.js), but it proved to be useful when bug fixing to reduce the amount of unnecessary testing done.
- Notifications are done via the backend sending a request to the frontend to display the notification. Doing so leaves the design of the notification entirely within the frontend, separating concerns. [Frontend Code](https://github.com/cbj252/bugtracker/blob/main/src/socket.js#L33) [Backend Code](https://github.com/cbj252/bugtracker_backend/blob/main/controllers/ticketController.js#L118)

# What I would do if I had more time

- Notifications require the frontend and backend to constantly keep a websocket connection with each other. This is fine, but several pages in the website cause the page to refresh and the websocket connection to be interrupted. This means in the scenario that a notification pops up at the same as a user does an action that causes the page to refresh, they will miss the notification. Finding an alternate way to do notifications or making it so that no refreshes are needed when traversing the website would be nice.
- Less cramped dashboard and tables: Some of the tables feel very long and may be unappealing and look poor on smaller screens, especially tablets or mobile devices. A restyling to make the frontend more attractive would be useful.

# Scripts

In the main directory, run:

`npm run start` - Frontend & Bakcend
Runs the website in a development server.
The program requires .env variables to run correctly.

`npm run devstart` - Backend only
Uses nodemon to run the website everytime a change is detected in the file directory.
The program requires .env variables to connect the backend to a database.
