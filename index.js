const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const admin = require('firebase-admin');
const ObjectId = require('mongodb').ObjectId;
require('dotenv').config();
const port = process.env.PORT || 8000;

const app = express();
app.use(cors());
app.use(express.json());
var serviceAccount = require('./configs/book-shelf-5699b-firebase-adminsdk-3q66l-72e16fe5b8.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const { MongoClient } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.tmhor.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

client.connect((err) => {
    console.log(err);
    const booksCollection = client.db('bookShelf').collection('bookShelfCollection');
    const orders = client.db('bookShelf').collection('orders');

    app.get('/books', (req, res) => {
        booksCollection.find().toArray((err, items) => {
            res.send(items);
        });
    });
    app.post('/addBook', (req, res) => {
        const newBook = req.body;
        console.log('adding', newBook);
        booksCollection.insertOne(newBook).then((result) => {
            console.log(result.insertedCount);
            res.send(result.insertedCount > 0);
        });
    });
    app.get('/book/:id', (req, res) => {
        booksCollection
            .find({ _id:ObjectId(req.params.id) })
            .toArray((err, documents) => {
                res.send(documents[0]);
            });
    });
    app.delete('/deleteBook/:id', (req, res) => {
        booksCollection
            .deleteOne({ _id:ObjectId(req.params.id) })
            .then((result) => {});
    });
    app.post('/addBooking', (req, res) => {
        const newBooking = req.body;
        orders.insertOne(newBooking).then((result) => {
            res.send(result.insertedCount > 0);
        });
        console.log(newBooking);
    });
    app.get('/bookings', (req, res) => {
        console.log(req.query.email);
        const bearer = req.headers.authorization;
        console.log(bearer);
        if (bearer && bearer.startsWith('Bearer ')) {
            const idToken = bearer.split(' ')[1];
            console.log({ idToken });
            admin
                .auth()
                .verifyIdToken(idToken)
                .then((decodedToken) => {
                    const tokenEmail = decodedToken.email;
                    const queryEmail = req.query.email;
                    if (tokenEmail == queryEmail) {
                        orders
                            .find({ email: queryEmail })
                            .toArray((err, documents) => {
                                res.status(200).send(documents);
                            });
                    } else {
                        res.status(401).send('Unauthorized Access');
                    }

                    // ...
                })
                .catch((error) => {
                    res.status(401).send('Unauthorized Access');
                });
        } else {
            res.status(401).send('Unauthorized Access');
        }
    });
    // app.get('/bookings', (req, res) => {
    //     const userEmail = req.query.email;
    //                     orders.find({ email:userEmail})
    //                         .toArray((err, documents) => {
    //                             res.send(documents);
    //                         })
    //                     });
});

app.get('/', (req, res) => {
    res.send('Hello World!');
});

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`);
});
