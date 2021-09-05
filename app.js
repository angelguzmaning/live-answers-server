const express = require("express");
const app = express();
const port = 7501;

const mongoose = require("mongoose");
mongoose.connect("mongodb://live-answers-mongo:27017/live_answers");
const db = mongoose.connection;

db.on("error", (err) => {
  console.log(err);
});

db.on("open", () => {
  console.log("Database Connection Established!");
});

const bodyParser = require("body-parser");
app.use(bodyParser.json());

const jsend = require("jsend");
app.use(jsend.middleware);

const cors = require("cors");
app.use(cors());

const http = require("http");
const server = http.createServer(app);
const WebSocket = require("ws");
const wss = new WebSocket.Server({ server });

wss.on("connection", async (ws) => {
  ws.send(await last100AnswersMessage());
});

async function last100AnswersMessage() {
  return JSON.stringify(await last100Answers());
}

async function last100Answers() {
  return (await Answers.find().sort({ createdAt: -1 }).limit(100)).map(
    answerToResultObject
  );
}

function answerToResultObject({ answer, id }) {
  return { answer, id };
}

const Answers = require("./schema/answers");
const invalidAnswers = ["yes", "I don't know", "no", "that's fine"];
app.post("/answers", async (req, res) => {
  if (!req.body.answer || req.body.answer === "") {
    res.jsend.fail({ error: "The answer cannot be empty" });
    return;
  }

  if (!isValidAnswer(req.body.answer)) {
    res.jsend.fail({
      error: `The answer cannot consist of one of the following: ${invalidAnswers.join(
        ", "
      )}`,
    });
    return;
  }

  const answer = new Answers({
    answer: req.body.answer,
    createdAt: new Date(),
  });
  await answer.save();
  wss.clients.forEach(async (client) =>
    client.send(await last100AnswersMessage())
  );
  res.jsend.success({});
});

function isValidAnswer(answer) {
  return !invalidAnswers.includes(answer);
}

app.get("/answers", async (req, res) => {
  res.jsend.success({
    answers: (await Answers.find().sort({ createdAt: -1 }).limit(100)).map(
      answerToResultObject
    ),
  });
});

server.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
