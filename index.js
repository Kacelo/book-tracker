import express from "express";
import pg from "pg";

// create db
const db = new pg.Client({
    user: "vernon",
  host: "localhost",
  database: "books",
  password: "admin",
  port: 5432,
})
// 
const app = expres();
const port = 3000;

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});

app.listen();
