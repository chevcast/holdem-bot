import { Message } from "discord.js";
import fs from "fs";
import util from "util";

const readFile = util.promisify(fs.readFile);

export const command = ["terms", "terminology", "glossary"];

export const description = "Show a list of poker terms.";

export async function handler ({ discord }) {
  const message = discord.message as Message;
  const pokerTerms = (await readFile("./poker-terms.md")).toString();
  await message.channel.send(pokerTerms.split("\n").map(line => line.trimEnd()).join("\n"), { split: true });
}