import dotenv from "dotenv";
dotenv.config();

import http from "http";
import moment from "moment";
import parse from "./parse";
import discordClient from "./discord-client";
import config from "./config";
import { initializeDb } from "./db";
import chatRelay from "./chat-relay";

const {
  COMMAND_PREFIX,
  PORT
} = config;

(async () => {

  discordClient.on("ready", () => {
    discordClient.user?.setActivity({ name: `for cmds | ${COMMAND_PREFIX}help`, type: "WATCHING" });
    console.log(`Holdem-bot online [${moment()}]`);
  });

  await initializeDb();

  discordClient.on("message", message => {
    const { content, author } = message;
    if (author.id === discordClient.user!.id) return;
    if (content.substr(0, COMMAND_PREFIX!.length) === COMMAND_PREFIX) {
      parse(content.substr(COMMAND_PREFIX.length), { discord: { message } });
      return;
    }
    chatRelay(message);
  });

  http.createServer((req, res) => {
    res.writeHead(200);
    res.write("Holdem-bot is running.\n\n");
    res.write(`COMMAND_PREFIX: ${COMMAND_PREFIX}\n`);
    res.end();
  }).listen(PORT || 3000);

})().catch(console.log);