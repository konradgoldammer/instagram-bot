const { MongoClient } = require('mongodb');
const dotenv = require('dotenv');

dotenv.config();

const dbURI = process.env.DB_URI;
const client = new MongoClient(dbURI, { useUnifiedTopology: true });

const db = {
    connect: async () => { // connect to the database
        try {
            await client.connect();
        } catch (e) {
            console.error(e);
        }
    },
    insertAbonnements: async posts => { // insert abonnements to the database
        try {
            const database = client.db("instagram_bot_db");
            const collection = database.collection("abonnements");

            posts.forEach(post => {
                post.active = true;
                post.subscriptionTimestamp = Number((String((new Date()).getTime())).slice(0, -3));
            })

            const result = await collection.insertMany(posts);
            console.log(`${result.insertedCount} documents were inserted in the collection: ${collection.namespace}.`);
        } catch (e) {
            console.error(e);
        }
    },
    getAllAbonnements: async () => { // receive all abonnements from the database
        try {
            const database = client.db("instagram_bot_db");
            const collection = database.collection("abonnements");
            const query = {};
            const options = {
                sort: {},
                projection: {}
            };
            const cursor = await collection.find(query, options);
            console.log(`Received ${await cursor.count()} documents from the collection: ${collection.namespace}.`);
            const abonnements = [];
            await cursor.forEach(element => abonnements.push(element));
            return abonnements;
        } catch (e) {
            console.error(e);
        }
    },
    setAbonnementsToInactive: async abonnements => { // set abonnements to inactive in the database
        try {
            const database = client.db('instagram_bot_db');
            const collection = database.collection('abonnements');
            for (abo of abonnements) {
                const filter = { _id: abo._id }
                const options = {};
                const updateDoc = {
                    $set: {
                        active: false,
                        cancellationTimestamp: Number(String((new Date()).getTime()).slice(0, -3))
                    }
                }
                const result = await collection.updateOne(filter, updateDoc, options);
                console.log(`${result.modifiedCount} abonnement was set to inacative in the collection: ${collection.namespace}. (${result.matchedCount} documents matched the filter.)`);
            }
        } catch (e) {
            console.error(e);
        }
    },
    close: async () => { // disconnect from the database
        await client.close();
    }
};

module.exports = db;