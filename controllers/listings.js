const Listing = require("../models/listing");
const axios = require("axios");

// ===== SHOW ALL LISTINGS =====
module.exports.index = async (req, res) => {
  try {
    const allListings = await Listing.find({});
    res.render("listings/index.ejs", { allListings, q: '', filters: {} });
  } catch (err) {
    console.error(err);
    req.flash("error", "Cannot fetch listings");
    res.redirect("/");
  }
};

// ===== NEW LISTING FORM =====
module.exports.renderNewForm = (req, res) => {
  const categories = ["Trending","Rooms","Iconic cities","Mountains","Castles","Pools","Camping","Farms","Arctic","Doms","Boats"];
  res.render("listings/new.ejs", { categories });
};

// ===== SHOW SINGLE LISTING =====
module.exports.showListing = async (req, res) => {
  try {
    const { id } = req.params;
    const listing = await Listing.findById(id)
      .populate({ path: "reviews", populate: { path: "author" } })
      .populate("owner");

    if (!listing) {
      req.flash("error", "Listing does not exist!");
      return res.redirect("/listings");
    }

    res.render("listings/show.ejs", { listing });
  } catch (err) {
    console.error(err);
    req.flash("error", "Cannot fetch listing");
    res.redirect("/listings");
  }
};

// ===== CREATE NEW LISTING =====
module.exports.createListing = async (req, res) => {
  try {
    // Ensure amenities is always an array
    if (req.body.listing.amenities && !Array.isArray(req.body.listing.amenities)) {
      req.body.listing.amenities = [req.body.listing.amenities];
    } else if (!req.body.listing.amenities) {
      req.body.listing.amenities = [];
    }

    const newListing = new Listing(req.body.listing);

    // Assign owner
    newListing.owner = req.user._id;

    // Assign image if uploaded
    if (req.file) {
      const url = req.file.path;
      const filename = req.file.filename;
      newListing.image = { url, filename };
    }

    // 🌍 Geocoding
    const maptilerToken = process.env.MAP_TOKEN;
    const geoResponse = await axios.get(
      `https://api.maptiler.com/geocoding/${encodeURIComponent(newListing.location)}.json`,
      { params: { key: maptilerToken } }
    );

    if (geoResponse.data.features.length > 0) {
      newListing.geometry = geoResponse.data.features[0].geometry;
    } else {
      req.flash("error", "Location not found. Try again.");
      return res.redirect("/listings/new");
    }

    await newListing.save();
    req.flash("success", "New Listing Created!");
    res.redirect(`/listings/${newListing._id}`);
  } catch (err) {
    console.error(err);
    req.flash("error", "Something went wrong while creating listing");
    res.redirect("/listings/new");
  }
};

// ===== RENDER EDIT FORM =====
module.exports.renderEditForm = async (req, res) => {
  try {
    const { id } = req.params;
    const listing = await Listing.findById(id);

    if (!listing) {
      req.flash("error", "Listing does not exist!");
      return res.redirect("/listings");
    }

    const categories = ["Trending","Rooms","Iconic cities","Mountains","Castles","Pools","Camping","Farms","Arctic","Doms","Boats"];

    // Prepare image preview
    let originalImageUrl = "";
    if (listing.image && listing.image.url) {
      originalImageUrl = listing.image.url.replace("/upload", "/upload/w_250");
    }

    res.render("listings/edit.ejs", { listing, categories, originalImageUrl });
  } catch (err) {
    console.error(err);
    req.flash("error", "Cannot load edit form");
    res.redirect("/listings");
  }
};


// ===== UPDATE LISTING =====
module.exports.updateListing = async (req, res) => {
  try {
    // Ensure amenities is always an array
    if (req.body.listing.amenities && !Array.isArray(req.body.listing.amenities)) {
      req.body.listing.amenities = [req.body.listing.amenities];
    } else if (!req.body.listing.amenities) {
      req.body.listing.amenities = [];
    }

    const { id } = req.params;
    const listing = await Listing.findByIdAndUpdate(id, { ...req.body.listing }, { new: true });

    if (req.file) {
      const url = req.file.path;
      const filename = req.file.filename;
      listing.image = { url, filename };
      await listing.save();
    }

    // Optional: re-geocode if location changed
    if (req.body.listing.location && req.body.listing.location !== listing.location) {
      const maptilerToken = process.env.MAP_TOKEN;
      const geoResponse = await axios.get(
        `https://api.maptiler.com/geocoding/${encodeURIComponent(req.body.listing.location)}.json`,
        { params: { key: maptilerToken } }
      );
      if (geoResponse.data.features.length > 0) {
        listing.geometry = geoResponse.data.features[0].geometry;
        listing.location = req.body.listing.location;
        await listing.save();
      }
    }

    req.flash("success", "Listing Updated!");
    res.redirect(`/listings/${id}`);
  } catch (err) {
    console.error(err);
    req.flash("error", "Something went wrong while updating listing");
    res.redirect("/listings");
  }
};


// ===== DELETE LISTING =====
module.exports.deleteListing = async (req, res) => {
  try {
    const { id } = req.params;
    await Listing.findByIdAndDelete(id);
    req.flash("success", "Listing Deleted!");
    res.redirect("/listings");
  } catch (err) {
    console.error(err);
    req.flash("error", "Cannot delete listing");
    res.redirect("/listings");
  }
};

// ===== SEARCH BY TEXT =====
module.exports.searchListings = async (req, res) => {
  const { q } = req.query;
  if (!q || q.trim() === "") return res.redirect("/listings");

  try {
    const listings = await Listing.find(
      { $text: { $search: q } },
      { score: { $meta: "textScore" } }
    ).sort({ score: { $meta: "textScore" } }).limit(50);

    res.render("listings/index.ejs", { allListings: listings, q, filters: {} });
  } catch (err) {
    console.error(err);
    req.flash("error", "Search failed");
    res.redirect("/listings");
  }
};

// ===== SEARCH & FILTER LISTINGS =====
module.exports.searchAndFilterListings = async (req, res) => {
  const { q, category, rooms, amenities } = req.query;
  let filter = {};

  // Text search
  if (q && q.trim() !== "") filter.$text = { $search: q };

  // Category filter
  if (category && category !== "All") filter.category = category;

  // Minimum rooms filter
  if (rooms) filter.rooms = { $gte: parseInt(rooms) };

  // Price range filter
  const minPrice = req.query.minPrice ? parseFloat(req.query.minPrice) : null;
  const maxPrice = req.query.maxPrice ? parseFloat(req.query.maxPrice) : null;
  if (minPrice !== null && maxPrice !== null) {
    filter.price = { $gte: minPrice, $lte: maxPrice };
  } else if (minPrice !== null) {
    filter.price = { $gte: minPrice };
  } else if (maxPrice !== null) {
    filter.price = { $lte: maxPrice };
  }

  // Amenities filter
  if (amenities) {
    // Ensure amenities is an array
    const amenitiesArr = Array.isArray(amenities) ? amenities : [amenities];
    filter.amenities = { $all: amenitiesArr };
  }

  try {
    let query = Listing.find(filter);

    if (filter.$text) query = query.sort({ score: { $meta: "textScore" } });

    const listings = await query.limit(50);

    // Pass filters and categories for form prefill
    const categories = ["Trending","Rooms","Iconic cities","Mountains","Castles","Pools","Camping","Farms","Arctic","Doms","Boats"];
    res.render("listings/index.ejs", { allListings: listings, filters: req.query, categories, q });
  } catch (err) {
    console.error(err);
    req.flash("error", "Filter failed");
    res.redirect("/listings");
  }
};

