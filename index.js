const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const app = express();
const port = process.env.PORT || 5000;

// app.use(
//   cors({
//     origin: ["http://localhost:5173", "http://localhost:5174"],
//     credentials: true,
//   })
// );
app.use(express.json());
app.use(cors());
app.use(cookieParser());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.mz3fw7v.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

const verifyToken = async (req, res, next) => {
  const token = req.cookies?.token;
  // console.log("value of token in middleware", token);
  if (!token) {
    return res.status(401).send({ status: "unAuthorized Access" });
  }
  jwt.verify(token, process.env.ACCESS_TOKEN_PASS, (err, decoded) => {
    if (err) {
      return res.status(401).send({ status: "unAuthorized" });
    }
    // console.log("value in verify token", decoded);
    req.user = decoded;
    next();
  });
};

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const allFoodCollection = client.db("foodiePal").collection("allFoods");
    const orderFoodCollection = client.db("foodiePal").collection("orderFoods");
    const userCollection = client.db("foodiePal").collection("users");
    const bookingCollection = client.db("foodiePal").collection("bookings");

    // jwt api
    app.post("/jwt", async (req, res) => {
      const user = req.body;
      console.log("email:", user);
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "5h",
      });
      // console.log(token);
      const expireDate = new Date();
      expireDate.setDate(expireDate.getDate() + 7);
      res
        .cookie("token", token, {
          httpOnly: true,
          secure: false,
          expires: expireDate,
          // sameSite: "none",
        })
        .send({ success: true });
    });

    //logout api
    app.post("/logout", async (req, res) => {
      const user = req.body;
      console.log("logging out", user);
      res.clearCookie("token", { maxAge: 0 }).send({ success: true });
    });

    //get top ordered foods api
    app.get("/top-foods", async (req, res) => {
      try {
        let query = {};
        const options = {
          projection: {
            foodName: 1,
            foodImage: 1,
            foodCategory: 1,
            price: 1,
            count: 1,
          },
        };
        // console.log(foodCategory);
        const result = await allFoodCollection
          .find(query, options)
          .sort({ count: -1 })
          .limit(6)
          .toArray();
        res.send(result);
      } catch (error) {
        console.log(error);
      }
    });
    //get all foods api
    app.get("/all-foods", async (req, res) => {
      try {
        let query = {};
        let sortObj = {};
        const foodName = req.query?.foodName;
        const sortField = req.query.sortField;
        const sortOrder = req.query.sortOrder;
        const page = parseInt(req.query.page);
        const size = parseInt(req.query.size);
        // console.log(page, size);
        console.log(sortField);

        if (sortField && sortOrder) {
          sortObj[sortField] = sortOrder;
        }
        console.log(sortObj);
        const options = {
          projection: {
            foodName: 1,
            foodImage: 1,
            foodCategory: 1,
            price: 1,
          },
        };
        if (foodName) {
          query.foodName = foodName;
          const result = await allFoodCollection
            .find(query, options)
            .skip(page * size)
            .limit(size)
            .sort(sortObj)
            .toArray();
          res.send(result);
        } else {
          const result = await allFoodCollection
            .find({})
            .skip(page * size)
            .limit(size)
            .toArray();
          res.send(result);
        }
      } catch (error) {
        console.log(error);
      }
    });

    //get foods by name
    app.get("/search-foods/:foodName", async (req, res) => {
      try {
        const foodName = req.params.foodName;
        let query = { foodName: foodName };
        console.log(foodName);
        const result = await allFoodCollection.find(query).toArray();
        res.send(result);
      } catch (error) {
        console.log(error);
      }
    });

     //post bookings
     app.post("/bookings", async (req, res) => {
      try {
        const newBooking= req.body;
        const result = await bookingCollection.insertOne(newBooking);
        res.send(result);
      } catch (error) {
        console.log(error);
      }
    });

    app.get("/bookings/:email", async (req, res) => {
      try {
        const email = req.params.email;
        const query = { email: email };
        const result = await bookingCollection.find(query).toArray();
        res.send(result);
      } catch (error) {
        console.log(error);
      }
    });

    //foods limit count
    app.get("/foodsCount", async (req, res) => {
      const count = await allFoodCollection.estimatedDocumentCount();
      // console.log(count);
      res.send({ count });
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

    //get added food item by id
    app.get("/added-food/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) };
        const result = await allFoodCollection.find(query).toArray();
        // console.log('hi', result)
        res.send(result);
      } catch (error) {
        console.log(error);
      }
    });
    //update added food item
    app.put("/update-food/:id", async (req, res) => {
      try {
        const id = req.params.id;
        console.log(id);
        const query = { _id: new ObjectId(id) };
        const body = req.body;
        console.log(body);
        const updatedFood = {
          $set: { ...body },
        };
        const option = { upsert: true };
        const result = await allFoodCollection.updateOne(
          query,
          updatedFood,
          option
        );
        console.log(result);
        res.send(result);
      } catch (error) {
        console.log(error);
      }
    });

    //update quantity of added food item
    app.put("/update-quantity/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) };
        // console.log(query);
        const updatedFood = {
          $inc: { quantity: -1, count: +1 },
        };
        console.log(updatedFood);
        const option = { upsert: true };
        const result = await allFoodCollection.updateOne(
          query,
          updatedFood,
          option
        );
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

    //store register user information api
    app.post("/users", async (req, res) => {
      const newUser = req.body;
      const result = await userCollection.insertOne(newUser);
      res.send(result);
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
