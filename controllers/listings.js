// controllers/listings.js
const Listing = require("../models/listing");
const axios = require("axios");

module.exports.index = async (req, res) => {
  try {
    const allListings = await Listing.find({});
    res.render("listings/index.ejs", { allListings });
  } catch (err) {
    console.error(err);
    req.flash("error", "Cannot fetch listings");
    res.redirect("/");
  }
};

module.exports.renderNewForm = (req, res) => {
  res.render("listings/new.ejs");
};

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

module.exports.createListing = async (req, res) => {
  try {
    const url = req.file.path;
    const filename = req.file.filename;

    const newListing = new Listing(req.body.listing);
    newListing.owner = req.user._id;
    newListing.image = { url, filename };

    // 🌍 MapTiler Geocoding
    const maptilerToken = process.env.MAP_TOKEN;
    const geoResponse = await axios.get(
      `https://api.maptiler.com/geocoding/${encodeURIComponent(newListing.location)}.json`,
      { params: { key: maptilerToken } }
    );

    if (geoResponse.data && geoResponse.data.features.length > 0) {
      newListing.geometry = geoResponse.data.features[0].geometry;
    } else {
      req.flash("error", "Location not found. Try again.");
      return res.redirect("/listings/new");
    }

    await newListing.save();
    req.flash("success", "New Listing Created!");
    return res.redirect(`/listings/${newListing._id}`);
  } catch (err) {
    console.error(err);
    req.flash("error", "Something went wrong while creating listing");
    return res.redirect("/listings/new");
  }
};

module.exports.renderEditForm = async (req, res) => {
  try {
    const { id } = req.params;
    const listing = await Listing.findById(id);

    if (!listing) {
      req.flash("error", "Listing does not exist!");
      return res.redirect("/listings");
    }

    let originalImageUrl = listing.image.url;
    originalImageUrl = originalImageUrl.replace("/upload", "/upload/w_250");

    res.render("listings/edit.ejs", { listing, originalImageUrl });
  } catch (err) {
    console.error(err);
    req.flash("error", "Cannot load edit form");
    return res.redirect("/listings");
  }
};

module.exports.updateListing = async (req, res) => {
  try {
    const { id } = req.params;
    const listing = await Listing.findByIdAndUpdate(id, { ...req.body.listing });

    if (typeof req.file !== "undefined") {
      const url = req.file.path;
      const filename = req.file.filename;
      listing.image = { url, filename };
      await listing.save();
    }

    // Optional: Re-geocode if location changed
    if (req.body.listing.location && req.body.listing.location !== listing.location) {
      const maptilerToken = process.env.MAP_TOKEN;
      const geoResponse = await axios.get(
        `https://api.maptiler.com/geocoding/${encodeURIComponent(req.body.listing.location)}.json`,
        { params: { key: maptilerToken } }
      );
      if (geoResponse.data.features.length > 0) {
        listing.geometry = geoResponse.data.features[0].geometry;
        listing.location = req.body.listing.location; // update location
        await listing.save();
      }
    }

    req.flash("success", "Listing Updated!");
    return res.redirect(`/listings/${id}`);
  } catch (err) {
    console.error(err);
    req.flash("error", "Something went wrong while updating listing");
    return res.redirect("/listings");
  }
};

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
