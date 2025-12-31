const { MongoClient } = require("mongodb");

async function run() {
  const uri = process.env.MONGODB_URL;
  if (!uri) throw new Error("Set MONGODB_URL");
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db("Congor");
  const payments = db.collection("payments");

  const doc = {
    transactionId: "mymsxerg",
    email: "akuntorry01@gmail.com",
    username: "mymsxerg_user",
    planId: "1gb/unli",
    planName: "PANEL BOT 1GB EXPRESS",
    total: 8500,
    createdAt: new Date(),
    status: "completed",
    replaceUsed: 0
  };

  await payments.updateOne({ transactionId: doc.transactionId }, { $set: doc }, { upsert: true });
  console.log("Inserted/updated test transaction:", doc.transactionId);
  await client.close();
}

run().catch((e) => { console.error(e); process.exit(1); });
