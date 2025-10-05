const mongoose = require("mongoose");
const axios = require("axios");
const initData = require("./data.js");
const Listing = require("../models/listing.js");

const MONGO_URL = "mongodb://127.0.0.1:27017/wanderlust";

main()
  .then(() => {
    console.log("connected to DB");
  })
  .catch((err) => {
    console.log(err);
  });

async function main() {
  await mongoose.connect(MONGO_URL);
}

const initDB = async () => {
  await Listing.deleteMany({});

  const processedData = [];
  for (let obj of initData.data) {
    // Add category if missing
    if (!obj.category) {
      obj.category = "Trending"; // default
    }

    // Add dummy geometry if missing
    if (!obj.geometry) {
      obj.geometry = { type: "Point", coordinates: [0, 0] }; // dummy
    }

    obj.owner = "68c7b76298f11c3018ac2817";
    processedData.push(obj);
  }

  await Listing.insertMany(processedData);
  console.log("data was initialized");
};

initDB();