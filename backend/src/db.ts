import { Db, MongoClient } from "mongodb";

const uri = `mongodb://${process.env.APP_DB_USER}:${process.env.APP_DB_PASS}@mongodb:27017?authSource=${process.env.APP_DB}`;
const client = new MongoClient(uri);
client.connect().catch(console.error);
let db: Db = client.db("waypoint");

export default db;