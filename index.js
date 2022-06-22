const express = require("express");
var cors = require("cors");
require("dotenv").config();
const jwt = require("jsonwebtoken");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(express.json());
app.use(cors());

const verifyJWT = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json("unauthorized access");
    }
    const token = authHeader.split(" ")[1];
    jwt.verify(token, process.env.SECRET_KEYS, async (err, decoded) => {
        if (err) {
            return res.status(403).json("Forbidden access");
        } else {
            console.log("decoded", decoded);
            req.decoded = decoded;
            console.log("inside jwtVerify");
        }
        await next();
    });
};

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.yanaeka.mongodb.net`;

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
    try {
        await client.connect();

        const serviceCollections = client.db("geniusCar").collection("services");
        const orderCollections = client.db("geniusCar").collection("orders");

        // AUTH API

        app.post("/getToken", async (req, res) => {
            const user = req.body;
            const accessToken = jwt.sign(user, process.env.SECRET_KEYS, {
                expiresIn: "1d",
            });
            res.send({ accessToken });
        });

        // SERVICES API

        app.get("/services", async (req, res) => {
            const query = {};
            const cursor = serviceCollections.find(query);
            const services = await cursor.toArray();
            res.send(services);
        });

        app.get("/service/:id", async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const service = await serviceCollections.findOne(query);
            res.send(service);
        });

        app.post("/addService", async (req, res) => {
            const addedService = req.body;
            const result = await serviceCollections.insertOne(addedService);
            res.send(result);
        });

        app.delete("/deleteService/:id", async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await serviceCollections.deleteOne(query);
            res.send(result);
        });

        app.post("/order", async (req, res) => {
            const order = req.body;
            const result = await orderCollections.insertOne(order);
            res.send(result);
        });

        app.get("/order-track/:id", async (req, res) => {
            const id = req.params.id;
            const query = { orderId: id };
            const order = await orderCollections.findOne(query);
            res.send(order);
        });

        app.get("/orders", verifyJWT, async (req, res) => {
            const decodedEmail = req.decoded?.email;
            const email = req.query.email;
            if (email) {
                if (decodedEmail === email) {
                    const query = { email: email };
                    const cursor = orderCollections.find(query);
                    const orders = await cursor.toArray();
                    res.send(orders);
                } else {
                    res.status(403).send({ message: "Forbidden access" });
                }
            } else {
                const cursor = orderCollections.find({});
                const orders = await cursor.toArray();
                res.send(orders);
            }
        });
    } finally {
        // await client.close();
    }
}
run().catch(console.dir);

app.get("/", (req, res) => res.send("Server is running..."));

app.listen(port, () => console.log(`Example app listening on port ${port}!`));
