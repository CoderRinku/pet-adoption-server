const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const jwt = require("jsonwebtoken");
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

const verifyToken = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).send({ message: "Unauthorized Access" });
    }
    const token = authHeader.split(" ")[1];
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(403).send({ message: "Forbidden Access" });
        }
        req.decoded = decoded;
        next();
    });
};

async function run() {
    try {
        await client.connect();
        console.log("Connected to MongoDB!");

        const petsCollection = client.db("petAdoptionDB").collection("pets");
        const requestsCollection = client.db("petAdoptionDB").collection("requests");

        app.get("/", (req, res) => {
            res.send("Pet Adoption Server is running");
        });

        app.post("/jwt", (req, res) => {
            const { email } = req.body;
            const token = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: "7d" });
            res.send({ token });
        });

        app.post("/pets", verifyToken, async (req, res) => {
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

        app.get("/my-pets", verifyToken, async (req, res) => {
            const { email } = req.query;
            if (req.decoded.email !== email) {
                return res.status(403).send({ message: "Forbidden Access" });
            }
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

        app.put("/pets/:id", verifyToken, async (req, res) => {
            const id = req.params.id;
            const updatedPet = req.body;
            const filter = { _id: new ObjectId(id) };
            const updateDoc = { $set: updatedPet };
            const result = await petsCollection.updateOne(filter, updateDoc);
            res.send(result);
        });

        app.delete("/pets/:id", verifyToken, async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await petsCollection.deleteOne(query);
            res.send(result);
        });

        app.post("/requests", verifyToken, async (req, res) => {
            const request = req.body;
            const result = await requestsCollection.insertOne(request);
            res.send(result);
        });

        app.get("/requests", verifyToken, async (req, res) => {
            const { email, ownerEmail } = req.query;
            let query = {};
            if (email) query = { requesterEmail: email };
            if (ownerEmail) query = { petAuthorEmail: ownerEmail };
            const result = await requestsCollection.find(query).toArray();
            res.send(result);
        });

        app.put("/requests/:id", verifyToken, async (req, res) => {
            const id = req.params.id;
            const { status, petId } = req.body;
            const filter = { _id: new ObjectId(id) };
            const updateDoc = { $set: { status } };
            const result = await requestsCollection.updateOne(filter, updateDoc);
            if (status === "accepted" && petId) {
                const petFilter = { _id: new ObjectId(petId) };
                const petUpdate = { $set: { adopted: true } };
                await petsCollection.updateOne(petFilter, petUpdate);
            }
            res.send(result);
        });

    } finally {}
}

run().catch(console.dir);

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});