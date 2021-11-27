const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const abonnementSchema = new Schema({
  date: {
    type: Date,
    default: () => new Date(),
  },
  active: {
    type: Boolean,
    default: true,
  },
  followedBack: {
    type: Boolean,
    default: null,
  },
  user: {
    type: Object,
    required: true,
  },
});

const Abonnement = mongoose.model("abonnement", abonnementSchema);
module.exports = Abonnement;
