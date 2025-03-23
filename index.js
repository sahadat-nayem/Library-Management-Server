const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 5000;

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://library-management-72606.firebaseapp.com",
      "https://library-management-72606.web.app",
    ],
    credentials: true,
  })
);

app.use(express.json());

// MongoDB Connection
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.gcvod.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    await client.connect();
    console.log("✅ Connected to MongoDB");

    // Collections
    const booksCollection = client.db("libraryManagement").collection("books");
    const borrowCollection = client
      .db("libraryManagement")
      .collection("borrow");
    const userCollection = client.db("libraryManagement").collection("users");

    // GET Borrowed Books by Email (Fixed)
    app.get("/borrow", async (req, res) => {
      try {
        const borrowedBooks = await borrowCollection.find().toArray();
        res.send(borrowedBooks);
      } catch (error) {
        res.status(500).send({ message: "Server error" });
      }
    });

    // GET Borrowed Books by Email
    app.get("/borrow/email", async (req, res) => {
      const email = req.query.email;
      if (!email) {
        return res.status(400).send({ message: "Email query is required" });
      }
      // Filter borrow collection based on email
      const result = await borrowCollection.find({ email }).toArray();
      res.send(result);
    });

    // POST Borrow a Book
    app.post("/borrow", async (req, res) => {
      const borrowBook = req.body;

      if (!borrowBook.email || !borrowBook.bookId) {
        return res
          .status(400)
          .send({ message: "Email and Book ID are required" });
      }

      // Check if the user has already borrowed this book
      const existingBorrow = await borrowCollection.findOne({
        email: borrowBook.email,
        bookId: borrowBook.bookId,
      });

      if (existingBorrow) {
        return res
          .status(400)
          .send({ message: "You have already borrowed this book!" });
      }

      // Insert borrowing data
      const result = await borrowCollection.insertOne(borrowBook);
      res.json(result);
    });

    // DELETE Borrowed Book by ID
    app.delete("/borrow/:id", async (req, res) => {
      const id = req.params.id;
      if (!ObjectId.isValid(id)) {
        return res.status(400).send({ message: "Invalid ID format" });
      }
      const result = await borrowCollection.deleteOne({
        _id: new ObjectId(id),
      });
      res.send(result);
    });

    // User Login - Add or Update
    app.post("/users", async (req, res) => {
      const user = req.body;

      if (!user.email) {
        return res.status(400).send({ message: "Email is required" });
      }

      const existingUser = await userCollection.findOne({ email: user.email });

      if (existingUser) {
        // If user exists, update their last login timestamp
        const updatedUser = await userCollection.updateOne(
          { email: user.email },
          { $set: { lastLogin: new Date() } }
        );
        return res.send(updatedUser);
      } else {
        // If user does not exist, create a new user
        const newUser = {
          ...user,
          createdAt: new Date(),
          lastLogin: new Date(),
        };
        const result = await userCollection.insertOne(newUser);
        return res.send(result);
      }
    });

    // GET All Users
    app.get("/users", async (req, res) => {
      const users = await userCollection.find().toArray();
      res.send(users);
    });

    // GET User by Email
    app.get("/users/:email", async (req, res) => {
      const email = req.params.email;
      const user = await userCollection.findOne({ email });
      res.send(user);
    });

    // GET All Books
    app.get("/book", async (req, res) => {
      const books = await booksCollection.find().toArray();
      res.send(books);
    });

    // GET Limited Books (Example: 6 Books)
    app.get("/book/two", async (req, res) => {
      const books = await booksCollection.find().limit(6).toArray();
      res.send(books);
    });

    // GET Single Book by ID
    app.get("/books/:id", async (req, res) => {
      const id = req.params.id;
      if (!ObjectId.isValid(id)) {
        return res.status(400).send({ message: "Invalid ID format" });
      }
      const result = await booksCollection.findOne({ _id: new ObjectId(id) });
      res.send(result);
    });

    // POST New Book
    app.post("/book", async (req, res) => {
      const newBook = req.body;
      const result = await booksCollection.insertOne(newBook);
      res.json(result);
    });

    // UPDATE Book by ID
    app.patch("/book/:id", async (req, res) => {
      const { id } = req.params;

      // Check if the ID is valid
      if (!ObjectId.isValid(id)) {
        return res.status(400).send({ message: "Invalid ID format" });
      }

      const updatedBook = req.body;

      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          name: updatedBook.name,
          authorName: updatedBook.authorName,
          category: updatedBook.category,
          rating: Number(updatedBook.rating),
          photo: updatedBook.photo,
        },
      };

      try {
        const result = await booksCollection.updateOne(filter, updateDoc);

        if (result.matchedCount === 0) {
          return res.status(404).send({ message: "Book not found" });
        }

        res.send({ message: "Book updated successfully" });
      } catch (error) {
        res.status(500).send({ message: "Internal server error" });
      }
    });

    // GET a book by ID
    app.get("/book/:id", async (req, res) => {
      const { id } = req.params;

      if (!ObjectId.isValid(id)) {
        return res.status(400).send({ message: "Invalid ID format" });
      }

      const book = await booksCollection.findOne({ _id: new ObjectId(id) });
      res.send(book);
    });
  } catch (error) {
    console.error("❌ Error in Server:", error);
  }
}

run().catch(console.dir);

// Root Route
app.get("/", (req, res) => {
  res.send("Welcome to Library Management System");
});

// Start Server
app.listen(port, () => {
  console.log(`🚀 Server is running on port: ${port}`);
});
