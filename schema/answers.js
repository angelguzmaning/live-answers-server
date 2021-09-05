const mongoose = require("mongoose");

const answerSchema = new mongoose.Schema({
  answer: String,
  createdAt: Date
});

const Answers = mongoose.model("answers", answerSchema);
module.exports = Answers;
