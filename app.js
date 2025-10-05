if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

const express = require("express");
const app = express();
const mongoose = require("mongoose");
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const session = require("express-session");
const MongoStore = require('connect-mongo');
const flash = require("connect-flash");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const User = require("./models/user.js");
const ExpressError = require("./utils/ExpressError.js");

const listingRouter = require("./routes/listing.js");
const reviewRouter = require("./routes/review.js");
const userRouter = require("./routes/user.js");

// ---------------- MONGOOSE ----------------
const dbUrl = process.env.ATLASDB_URL || "mongodb://localhost:27017/wanderlust";

mongoose.connect(dbUrl)
  .then(() => console.log("✅ Connected to DB"))
  .catch(err => {
    console.log("❌ DB Connection Error:", err.message);
    if (err.message.includes('IP')) {
      console.log("💡 This is likely an IP whitelist issue with MongoDB Atlas.");
      console.log("   Please add your current IP address to the IP whitelist in your MongoDB Atlas dashboard:");
      console.log("   https://cloud.mongodb.com > Network Access > Add IP Address");
      console.log("   Or add 0.0.0.0/0 to allow access from anywhere (less secure)");
    }
    console.log("   The server will continue running but database operations will fail.");
  });

// ---------------- APP SETTINGS ----------------
app.engine("ejs", ejsMate);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.use(express.static(path.join(__dirname, "public")));

// ---------------- SESSION & FLASH ----------------

const store = MongoStore.create({
  mongoUrl: dbUrl,
  crypto: {
    secret: process.env.SECRET,
  },
  touchAfter: 24 * 3600,
});

store.on("error", function(e) {
  console.log("ERROR IN MONGO SESSION STORE", e);
});

const sessionOptions = {
  store,
  secret: process.env.SECRET,
  resave: false,
  saveUninitialized: true,
  cookie: {
    httpOnly: true,
    expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  },
};



app.use(session(sessionOptions));
app.use(flash());

// ---------------- PASSPORT ----------------
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// ---------------- FLASH MIDDLEWARE ----------------
// Middleware to make flash messages available in all templates
app.use((req, res, next) => {
    res.locals.currUser = req.user; // passport puts the logged-in user on req.user
    res.locals.success = req.flash("success");
    res.locals.error = req.flash("error");
    res.locals.categories = ["Trending","Rooms","Iconic cities","Mountains","Castles","Pools","Camping","Farms","Arctic","Doms","Boats"];
    next();
});


// ---------------- ROUTES ----------------
app.get("/", (req, res) => {
  res.redirect("/listings");
});


app.use("/listings", listingRouter);
app.use("/listings/:id/reviews", reviewRouter);
app.use("/", userRouter);

// ---------------- CATCH ALL 404 ----------------
app.all("*", (req, res, next) => {
  next(new ExpressError(404, "Page not found!"));
});

// ---------------- ERROR HANDLER ----------------
app.use((err, req, res, next) => {
    let { statusCode=500, message="Something went wrong!" } = err;
    res.status(statusCode).render("error.ejs", { message });
    });
// ---------------- SERVER ----------------
const PORT = process.env.PORT || 8080;
const server = app.listen(PORT, () => {
  console.log(`🚀 Server is listening on port ${PORT}`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use. Please kill the process using this port or choose a different port.`);
    console.error(`   To find the process: lsof -i :${PORT}`);
    console.error(`   To kill the process: kill -9 <PID>`);
  } else {
    console.error('❌ Server error:', err);
  }
  process.exit(1);
});
