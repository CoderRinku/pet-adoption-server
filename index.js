const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors({
    origin: ['http://localhost:5173'],
    credentials: true
}));
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ya5v9cx.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        const db = client.db('petAdoptionDB');
        const petsCollection = db.collection('pets');
        const requestsCollection = db.collection('requests');

        console.log("Connected to MongoDB!");

        app.post('/pets', async (req, res) => {
            const petData = req.body;
            const result = await petsCollection.insertOne(petData);
            res.send(result);
        });

        app.get('/pets', async (req, res) => {
            const cursor = petsCollection.find();
            const result = await cursor.toArray();
            res.send(result);
        });

        app.get('/pets/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await petsCollection.findOne(query);
            res.send(result);
        });

        app.post('/requests', async (req, res) => {
            const requestData = req.body;
            const result = await requestsCollection.insertOne(requestData);
            res.send(result);
        });

        app.get('/requests', async (req, res) => {
            const cursor = requestsCollection.find();
            const result = await cursor.toArray();
            res.send(result);
        });

        app.get('/my-pets', async (req, res) => {
            let query = {};
            if (req.query?.email) {
                query = { authorEmail: req.query.email };
            }
            const cursor = petsCollection.find(query);
            const result = await cursor.toArray();
            res.send(result);
        });

    } catch (error) {
        console.log(error);
    }
}
run().catch(console.dir);

app.get('/', (req, res) => {
    res.send('Pet Adoption Server is Running');
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});