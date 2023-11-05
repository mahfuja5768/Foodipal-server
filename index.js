const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();
const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.mz3fw7v.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const allFoodCollection = client.db("foodiePal").collection("allFoods");

    //get all foods api
    app.get("/all-foods", async (req, res) => {
      try {
        const result = await allFoodCollection.find().toArray();
        res.send(result);
      } catch (error) {
        console.log(error);
      }
    });

    //get a food item by id api
    app.get("/all-foods/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const query = {_id: new ObjectId(id)};
        const result = await allFoodCollection.find(query).toArray();
        res.send(result);
      } catch (error) {
        console.log(error);
      }
    });

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("foodiePal is running");
});

app.listen(port, () => {
  console.log(`foodiePal server is running on port ${port}`);
});
