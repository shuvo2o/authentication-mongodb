const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
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
            const { name,email, password} = req.body;
            const hasedPassword = await bcrypt.hash(password, 10)
            console.log(hasedPassword)
            try {
                const existingUser = await usersCollection.findOne({ email});
                if (existingUser) return res.status(400).json({ message: "User already exists"})
                const newUser = {
                    name,
                    email,
                    password: hasedPassword,
                    role: "user",
                    createdAt :new Date()
                }
                const result = await usersCollection.insertOne(newUser);
                res.status(201).json({
                    message: "User registered succesfullty",
                    result
                })
            } catch (error) {
                res.status(500).json({
                    message: "Failed to register user",
                    error: error.message
                })
            }
            
        })

        // login user
        app.post("/login", async (req, res) =>{
            const { email, password} = req.body;
            try {
                const userExists = await usersCollection.findOne({ email})
                console.log(userExists)
                if (!userExists) return res.status(404).json({ message: "User not found"})

                const isPasswordValid = await bcrypt.compare(password, userExists.password)
                if (!isPasswordValid) return res.status(401).json({ message: "Invalid password"})
                res.json({message: "Login succesful"})
            } catch (error) {
                 res.status(500).json({
                    message: "Failed to get user",
                    error: error.message
                })
            }
        })
        // get all users 
        app.get("/users", async(req, res)=> {
            try {
                const users = await usersCollection.find({}, {projection: {password:0}}). toArray();
                res.json({
                    message: "Get all users",
                    users
                })
                
            } catch (error) {
                res.status(500).json({
                    message: "Failed to get user",
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
