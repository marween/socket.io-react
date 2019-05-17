# BeCode: Piece Checkers

> 🛰️ Short project's description

* * * 
A checkers game

## About
The goal of this exercise was to learn socket IO and real-time, bidirectional and event-based communication between the browser and the server.

According the rules of the exercise the server-side technologies were mandatory. The ones for the front-end part were free.

* Node.JS (server-side)
* Websockets/Socket IO (server-side)
* React JS (client-side)

## Installation

You will need [node.js](https://nodejs.org/en/) and [npm](https://www.npmjs.com/) installed on your computer.

**To play localy**
Run npm install

In *servers.js* (root) replace

`endpoint: undefined, //Heroku`

by:

`endpoint: "localhost:8000", //Local`

* Use `node server.js` in the *root* to launch the server
* Use `npm start` in the directory *socket-client*

**To build the app for Heroku:**

You will need this command line in package.json:

`"build": "cd socket-client && npm install && npm run build"`

In the root:
* `npm install` to install dependencies
* `npm run build` to build for production

## Usage 

* Insert your name then create or join a room
* ...
* Play!

* * *

May 2019, Jonathan Blavier Anne-Magali Saint-Georges.