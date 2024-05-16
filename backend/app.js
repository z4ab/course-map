const express = require('express');
const scraper = require('./scraper');

// These headers are required to by
const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST,PATCH,OPTIONS'
}

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3030;

app.listen(PORT, () => {
    console.log("Back end server listening on port:", PORT);
})

app.get("/status", (request, response) => {
    const status = {
        "Status": "Running"
    };

    response.send(status);
});

app.get("/coursedata", (request, response) => {
    response.set(headers);
    scraper.getCourseData().then(data => {
        response.send(data);
    })
});

app.post("/selection", (request, response) => {
    response.set(headers);
    console.log(request.body);
    run(request.body.json()).catch(console.dir);
    response.send("ok");
})

const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = `mongodb+srv://zaid:${pwd}@course-map.1ampwar.mongodb.net/?retryWrites=true&w=majority&appName=course-map`;
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});
async function run(courses) {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");

    const db = client.db('data');
    const collection = db.collection('selection');

    console.log(await client.db().admin().listDatabases());

    const insertResult = await collection.insertOne({user:"main", course_list: courses});
    console.log('Inserted documents =>', insertResult);

  } finally {
    // Ensures that the client will close when you finish/error
    await client.close();
  }
}