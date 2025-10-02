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

  // ===== NEW FIELDS FOR FILTERING =====
  categories: [{ type: String, index: true }],
  propertyType: { type: String, index: true },
  rooms: { type: Number, default: 1, index: true },
  beds: { type: Number, default: 1 },
  bathrooms: { type: Number, default: 1 },
  amenities: [{ type: String, index: true }],
  hostLanguage: [{ type: String, index: true }],
});

// Middleware to delete reviews when listing is deleted
listingSchema.post("findOneAndDelete", async (listing) => {
  if (listing) {
    await Review.deleteMany({ _id: { $in: listing.reviews } });
  }
});

// Indexes for faster filtering
listingSchema.index({ 'geometry': '2dsphere' });
listingSchema.index({ price: 1 });
listingSchema.index({ categories: 1 });
listingSchema.index({ amenities: 1 });
listingSchema.index({ propertyType: 1 });

// ===== TEXT INDEX FOR FUZZY SEARCH =====
listingSchema.index({ title: "text", location: "text" });

const Listing = mongoose.model("Listing", listingSchema);
module.exports = Listing;
