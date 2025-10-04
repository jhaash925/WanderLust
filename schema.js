const Joi = require('joi');

const listingSchema = Joi.object({
  listing: Joi.object({
    title: Joi.string().required(),
    description: Joi.string().required(),
    price: Joi.number().required(),
    location: Joi.string().required(),
    country: Joi.string().required(),
    category: Joi.string()
      .valid(
        "Trending","Rooms","Iconic cities","Mountains","Castles",
        "Pools","Camping","Farms","Arctic","Doms","Boats"
      )
      .required(),
    rooms: Joi.number().min(1).optional(),
    beds: Joi.number().min(1).optional(),
    bathrooms: Joi.number().min(1).optional(),
    amenities: Joi.array().items(Joi.string()).optional(),
  }).required()
});

const reviewSchema = Joi.object({
  review: Joi.object({
    rating: Joi.number().required().min(1).max(5),
    comment: Joi.string().required(),
  }).required()
});

module.exports = { listingSchema, reviewSchema };
