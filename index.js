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
let currentUserId = 1;

app.get("/", async (req, res) => {
  //   res.send("Hello World!");
  try {
    const userQuery = await db.query("SELECT * FROM users");
    res.render("index.ejs", { books, users: userQuery.rows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
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
  const user_id = 2;
  console.log(currentUserId);
  try {
    await db.query(
      "INSERT INTO reading_list (user_id, book_id) VALUES($1, $2) RETURNING *;",
      [currentUserId, bookId]
    );
    res.redirect("/reading-list-view");
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});
app.post("/user", async (req, res) => {
  if (req.body.add === "new") {
    res.render("new.ejs");
  } else {
    currentUserId = req.body.user;
    res.redirect("/");
  }
});
app.get("/reading-list-view", async (req, res) => {
  const userID = 2;
  console.log("current user", currentUserId);

  try {
    const books = await db.query(
      `SELECT * 
        FROM books b RIGHT JOIN
          reading_list r
          ON b.id = r.book_id
          WHERE user_id = ${currentUserId}
        GROUP BY b.id, r.id`
    );
    console.log("books", books.rows);
    res.render("list.ejs", { books: books.rows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});
app.post("/add-review", async (req, res) => {
  const reviewV = req.body["review"];
  const rating = req.body["rating"];
  const bookId = req.body["bookId"];

  console.log("Review:", reviewV, "Rating:", rating, "Book ID:", bookId, "User ID:", currentUserId);
  
  try {
    const query = await db.query(
      'UPDATE reading_list SET review = $1, rating = $2 WHERE user_id = $3 AND book_id = $4',
      [reviewV, rating, currentUserId, bookId]
    );

    console.log("Update Query Result:", query);
    res.redirect("/reading-list-view");
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});


app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});

app.listen();
