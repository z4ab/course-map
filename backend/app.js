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