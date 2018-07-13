/**
 * A minimal HTTP server implementation using express js for dev testing
 */
const HTTP_PORT = 3000;

const express = require("express");

express().use(express.static(__dirname)).listen(HTTP_PORT, err => {
  if (err) console.error(err);
  console.log("Server started on " + HTTP_PORT);
});