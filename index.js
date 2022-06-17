const express = require("express");
var cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(express.json());
app.use(cors());

const uri = `mongodb+srv://genius-car-service:F2PWvqoBuuFQzI2x@cluster0.yanaeka.mongodb.net`;

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
    try {
        await client.connect();

        const serviceCollections = client.db("geniusCar").collection("services");

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
    } finally {
        // await client.close();
    }
}
run().catch(console.dir);

// user: genius-car-service
// password: F2PWvqoBuuFQzI2x

app.get("/", (req, res) => res.send("Hello World!"));

app.listen(port, () => console.log(`Example app listening on port ${port}!`));
