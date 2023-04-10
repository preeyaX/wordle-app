import express from 'express';
import { MongoClient } from 'mongodb';
import bp from 'body-parser';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';

const MONGO_CONNECTION_STRING = "mongodb://localhost:27017"
const PORT = 8000;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const init = async () => {
    
    const client = new MongoClient(MONGO_CONNECTION_STRING, {
        useUnifiedTopology: true,
    }); // client created

    try { // connecting to mongoDb
        await client.connect(); // connection established
    } catch (e) {
        console.log(`Unable to connect to database: ${e}`);
    }
    console.log("Connected to MongoDb.");

    const app = express();

    app.use(bp.urlencoded({ extended: true }));
    app.use(bp.json());
    app.use(morgan('dev'));
    app.use(express.static('./static'));

    app.post('/post', async (req, res) => {
        const db = client.db('wordle');
        const collection = db.collection('words');

        const query = { 'guessNumber': req.body.guessNumber };
        const update = { $set: { 'word': req.body.word, 'guessNumber': req.body.guessNumber }};
        const options = { upsert: true };
        try {
            const result = await collection.updateOne(query, update, options);
            res.json({ 'word': req.body.word }).status(201).end();
        } catch (err) {
            console.log(`Unable to upsert collection: ${err}`);
        }
    });

    app.listen(PORT);
    console.log(`Running on http://localhost:${PORT}`);
}

init();