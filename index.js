const express = require('express');
const cors = require('cors');
const app = express();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const port = process.env.PORT || 5000;
require('dotenv').config()



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.gcvod.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");

    // Books related APIs
    const booksCollection = client.db('libraryManagement').collection('books');
    // const bookApplicationCollection = client.db('jobPortal').collection('job_applications');

    app.get('/books', async (req, res) => {
        const cursor = booksCollection.find({});
        const books = await cursor.toArray();
        res.send(books);
    });
    app.get('/book', async (req, res) => {
        const cursor = booksCollection.find({}).limit(4);
        const books = await cursor.toArray();
        res.send(books);
    });

    app.get('/books/:id', async (req, res) => {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) }
        const result = await booksCollection.findOne(query);
        res.send(result);
    });

  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.send('Welcome to Library Management System');
});

app.listen(port, () => {
    console.log(`Server is running on port: ${port}`);
});