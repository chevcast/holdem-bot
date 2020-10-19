import { Message } from "discord.js";
import fs from "fs";
import util from "util";

const readFile = util.promisify(fs.readFile);

export const command = ["terms", "terminology", "glossary"];

export const description = "Show a list of poker terms.";

export async function handler ({ discord }) {
  const message = discord.message as Message;
  // const pokerTerms = (await readFile("./poker-terms.md")).toString();
  // await message.channel.send(pokerTerms.split("\n").map(line => line.trimEnd()).join("\n"), { split: true });
  await message.reply("Please visit https://gist.github.com/chevtek/69bb18781d96aa930d8d1e45c28dd5ba for a glossary of useful poker terms :)");
}