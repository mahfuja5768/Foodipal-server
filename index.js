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
    const orderFoodCollection = client.db("foodiePal").collection("orderFoods");

    //get all foods api
    app.get("/all-foods", async (req, res) => {
      try {
        const options = {
          projection: {
            foodName: 1,
            foodImage: 1,
            foodCategory: 1,
            price: 1,
            quantity: 1,
          },
        };
        const result = await allFoodCollection.find({}, options).toArray();
        res.send(result);
      } catch (error) {
        console.log(error);
      }
    });

    //get a food item by id api
    app.get("/all-foods/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) };
        const result = await allFoodCollection.find(query).toArray();
        res.send(result);
      } catch (error) {
        console.log(error);
      }
    });

    //add new food item
    app.post("/add-food", async (req, res) => {
      try {
        const newFood = req.body;
        const result = await allFoodCollection.insertOne(newFood);
        res.send(result);
      } catch (error) {
        console.log(error);
      }
    });

    //get added food item
    app.get("/added-food", async (req, res) => {
      try {
        let query = {};
        if (req.query?.email) {
          query = { email: req.query.email };
        }
        const result = await allFoodCollection.find(query).toArray();
        // console.log(result)
        res.send(result);
      } catch (error) {
        console.log(error);
      }
    });

    //update added food item
    app.put("/update-food/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) };
        const body = req.body;
        const updatedShow = {
          $set: { ...body },
        };
        const option = { upsert: true };
        const result = await allFoodCollection.updateOne(query, updatedShow, option);
        res.send(result);
      } catch (error) {
        console.log(error);
      }
    });

    //delete added food item
    app.delete("/delete-food/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) };
        const result = await allFoodCollection.deleteOne(query);
        res.send(result);
      } catch (error) {
        console.log(error);
      }
    });

    //order food item
    app.post("/order-foods", async (req, res) => {
      try {
        const newFood = req.body;
        console.log(newFood);
        const result = await orderFoodCollection.insertOne(newFood);
        res.send(result);
      } catch (error) {
        console.log(error);
      }
    });

    //get order food item
    app.get("/order-foods", async (req, res) => {
      try {
        let query = {};
        if (req.query?.email) {
          query = { email: req.query.email };
        }
        const result = await orderFoodCollection.find(query).toArray();
        res.send(result);
      } catch (error) {
        console.log(error);
      }
    });

    //delete a order food item
    app.delete("/order-foods/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) };
        const result = await orderFoodCollection.deleteOne(query);
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
