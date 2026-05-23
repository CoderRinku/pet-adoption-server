const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const uri = process.env.MONGODB_URI;

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
        console.log("Connected to MongoDB!");

        const petsCollection = client.db("petAdoptionDB").collection("pets");
        const requestsCollection = client.db("petAdoptionDB").collection("requests");

        app.get("/", (req, res) => {
            res.send("Pet Adoption Server is running");
        });

        app.post("/pets", async (req, res) => {
            const pet = req.body;
            const result = await petsCollection.insertOne(pet);
            res.send(result);
        });

        app.get("/pets", async (req, res) => {
            const { search, category } = req.query;
            const query = {};

            if (search) {
                query.name = { $regex: search, $options: "i" };
            }

            if (category) {
                query.category = { $regex: `^${category}$`, $options: "i" };
            }

            const result = await petsCollection.find(query).toArray();
            res.send(result);
        });

        app.get("/my-pets", async (req, res) => {
            const { email } = req.query;
            const query = { authorEmail: email };
            const result = await petsCollection.find(query).toArray();
            res.send(result);
        });

        app.get("/pets/:id", async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await petsCollection.findOne(query);
            res.send(result);
        });

        app.put("/pets/:id", async (req, res) => {
            const id = req.params.id;
            const updatedPet = req.body;
            const filter = { _id: new ObjectId(id) };
            const updateDoc = { $set: updatedPet };
            const result = await petsCollection.updateOne(filter, updateDoc);
            res.send(result);
        });

        app.delete("/pets/:id", async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await petsCollection.deleteOne(query);
            res.send(result);
        });

        app.post("/requests", async (req, res) => {
            const request = req.body;
            const result = await requestsCollection.insertOne(request);
            res.send(result);
        });

        app.get("/requests", async (req, res) => {
            const { email } = req.query;
            const query = email ? { requesterEmail: email } : {};
            const result = await requestsCollection.find(query).toArray();
            res.send(result);
        });

        app.put("/requests/:id", async (req, res) => {
            const id = req.params.id;
            const { status } = req.body;
            const filter = { _id: new ObjectId(id) };
            const updateDoc = { $set: { status } };
            const result = await requestsCollection.updateOne(filter, updateDoc);
            res.send(result);
        });

    } finally {}
}

run().catch(console.dir);

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});