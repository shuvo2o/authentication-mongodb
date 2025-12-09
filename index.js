const express = require('express');
const cors = require('cors');
const app = express();
const { ObjectId } = require('mongodb');
const { MongoClient, ServerApiVersion } = require('mongodb');
require('dotenv').config();

const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// MongoDB Connection URI
const uri = process.env.MONGODB_URL;

// Create MongoClient
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        await client.connect();

        // Connect to DB and Collection
        const db = client.db("auth-management");
        const usersCollection = db.collection("users");

        // register user
        app.post("/register" ,async(req , res )=>{
            try {
                const newUser = await usersCollection.insertOne({...req.body, role: "user"})
                res.status(201).send(newUser)
            } catch (error) {
                res.status(500).json({
                    message: "Failed to register user",
                    error: error.message
                })
            }
            
        })

        // Ping MongoDB
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");

    } catch (error) {
        console.log("MongoDB Connection Error:", error);
    }
}

run().catch(console.dir);

// Default Route
app.get('/', (req, res) => {
    res.send('Authentication and Authorization in MongoDB....');
});

// Start Server
app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
});
