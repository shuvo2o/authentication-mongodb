const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const app = express();
const { ObjectId } = require('mongodb');
const { MongoClient, ServerApiVersion } = require('mongodb');
const { verifyToken } = require('./middleware/authMiddleware');
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
        const transactionsCollection = db.collection("transactions");
        // register user
        app.post("/register", async (req, res) => {
            const { name, email, password } = req.body;
            const hasedPassword = await bcrypt.hash(password, 10)
            console.log(hasedPassword)
            try {
                const existingUser = await usersCollection.findOne({ email });
                if (existingUser) return res.status(400).json({ message: "User already exists" })
                const newUser = {
                    name,
                    email,
                    password: hasedPassword,
                    role: "user",
                    createdAt: new Date()
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
        app.post("/login", async (req, res) => {
            const { email, password } = req.body;
            try {
                const userExists = await usersCollection.findOne({ email })

                if (!userExists) return res.status(404).json({ message: "User not found" })

                const isPasswordValid = await bcrypt.compare(password, userExists.password)
                if (!isPasswordValid) return res.status(401).json({ message: "Invalid password" })
                const token = jwt.sign({ userId: userExists._id, role: userExists.role }, process.env.JWT_SECRET_KEY, { expiresIn: 60 * 60 })
                res.json({ message: "Login succesful", token })
            } catch (error) {
                res.status(500).json({
                    message: "Failed to get user",
                    error: error.message
                })
            }
        })
        // get all users 
        app.get("/users", async (req, res) => {
            try {
                const users = await usersCollection.find({}, { projection: { password: 0 } }).toArray();
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

        // get transaction history by email
        app.get("/transactions/:email", verifyToken, async (req, res) => {
            console.log("User Come from middleware", req.user)
            const { email } = req.params;

            try {
                const user = await transactionsCollection
                    .find({ email })
                    .toArray();

                if (user.length === 0) {
                    return res.status(404).json({ message: "User and order not found" });
                }

                res.json({
                    message: "Get user transaction history",
                    user
                });

            } catch (error) {
                res.status(500).json({
                    message: "Failed to get user",
                    error: error.message
                });
            }
        });


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
