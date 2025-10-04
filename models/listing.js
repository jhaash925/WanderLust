// models/Listing.js
const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const Review = require("./review.js");

const listingSchema = new Schema({
  title: { type: String, required: true },
  description: String,
  image: {
    url: String,
    filename: String,
  },
  price: Number,
  location: String,
  country: String,
  geometry: {
    type: {
      type: String,
      enum: ["Point"],
      required: true,
    },
    coordinates: {
      type: [Number],
      required: true,
    },
  },
  reviews: [
    {
      type: Schema.Types.ObjectId,
      ref: "Review",
    },
  ],
  owner: {
    type: Schema.Types.ObjectId,
    ref: "User",
  },

  // NEW FIELD
  category: {
    type: String,
    required: true,
    enum: ["Trending","Rooms","Iconic cities","Mountains","Castles","Pools","Camping","Farms","Arctic","Doms","Boats"]
  },

  // existing fields for filtering
  propertyType: { type: String },
  rooms: { type: Number, default: 1, index: true },
  beds: { type: Number, default: 1 },
  bathrooms: { type: Number, default: 1 },
  amenities: [{ type: String }],
  hostLanguage: [{ type: String, index: true }],
});

// Delete reviews when listing is deleted
listingSchema.post("findOneAndDelete", async (listing) => {
  if (listing) {
    await Review.deleteMany({ _id: { $in: listing.reviews } });
  }
});

// Indexes for faster filtering
listingSchema.index({ 'geometry': '2dsphere' });
listingSchema.index({ price: 1 });
listingSchema.index({ category: 1 });
listingSchema.index({ amenities: 1 });
listingSchema.index({ propertyType: 1 });

// Text index for search
listingSchema.index({ title: "text", location: "text" });

module.exports = mongoose.model("Listing", listingSchema);
