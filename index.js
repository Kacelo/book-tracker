import express, { query } from "express";
import pg from "pg";
import bodyParser from "body-parser";
import axios from "axios";
const app = express();
const port = 3000;

// create db instance
const db = new pg.Client({
  user: "vernon",
  host: "localhost",
  database: "books",
  password: "admin",
  port: 5432,
});
// connect db
db.connect();
let books = [];
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

app.get("/", async (req, res) => {
  //   res.send("Hello World!");
  res.render("index.ejs", { books });
});
const setBookDetails = (books) => {
  //   const returnedBooks = books.docs;

  books.map(async (book) => {
    console.log(book.title);
    const cover = await getCover(book.cover_i);
    console.log("cover:", cover.config.url);
  });
};
const getCover = async (coverId) => {
  try {
    const response = await axios.get(
      `https://covers.openlibrary.org/b/id/${coverId}-M.jpg`
    );
    return response;
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
const formatQueries = (query) => {
  const result = query.replace(/ /g, "+");
  console.log("formatted query", result);
  return result;
};
app.post("/search", async (req, res) => {
  const input = req.body["book"];
  const query = formatQueries(input);
  console.log("input", query);
  try {
    const response = await axios.get(
      `https://openlibrary.org/search.json?title=${query}`
    );
    for (let index = 0; index < 10; index++) {
      books.push(response.data.docs[index]);
      // const element = array[index];
    }
    console.log(response.data.docs);
    // setBookDetails(books);
    res.redirect("/");

    // console.log(books.length);
    // res.json(books);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});
app.post("/add", async (req, res) => {
  const book = req.body["book"];

  try {
    const pos = books.map((book) => book?.title).indexOf(book);
    console.log("book", pos);
    const selectedBook = books[pos];
    const image_url = `https://covers.openlibrary.org/b/id/${selectedBook.cover_i}-M.jpg`;
    const author = selectedBook?.author_name.toLocaleString();
    const title = selectedBook.title;
    const result = await db.query(
      "INSERT INTO books (book_title, image_url, author) VALUES($1, $2, $3) RETURNING *;",
      [title, image_url, author]
    );
    res.redirect("/library");
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});
app.get("/library", async (req, res) => {
  try {
    const books = await db.query("SELECT * FROM books");
    console.log(books.rows);
    res.render("library.ejs", { books: books.rows });
  } catch (error) {
    console.error("Error fetching books:", error);
    res.status(500).send("Error fetching books");
  }
});
app.post("/reading-list", async (req, res) => {
  const bookId = req.body["bookId"];
  const user_id = 1;
  try {
    const result = await db.query(
      "INSERT INTO reading_list (user_id, book_id) VALUES($1, $2) RETURNING *;",
      [user_id, bookId]
    );
    console.log(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});
app.get("/")
app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});

app.listen();
