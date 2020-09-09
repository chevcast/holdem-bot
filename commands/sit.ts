import { Message } from "discord.js";
import { Table } from "../models";
import config from "../config";

const { COMMAND_PREFIX } = config;

export const command = ["sit [seat] [buy-in]", "join"];

export const description = "Join the current game.";

export const builder = yargs => yargs
  .positional("seat", {
    description: "Which seat you'd like to take.",
    type: "number"
  })
  .positional("buy-in", {
    description: "The amount of money to bring to the table. Default is the minimum buy-in for the table.",
    type: "number"
  });

export async function handler ({ discord, buyIn, seat }) {
  const message = discord.message as Message;
  if (message.channel.type === "dm") {
    message.reply("This command can only be run from a channel on a server.");
    return;
  }
  const table = await Table.findByChannelId(message.channel.id);
  if (!table) {
    message.reply("There is no active Hold'em game in this channel.");
    return;
  }
  const existingTable = await Table.findByPlayerId(message.author.id);
  if (existingTable && table.channel.id !== existingTable.channel.id) {
    message.reply(`You have already joined a table. Use \`${COMMAND_PREFIX}stand\` from your Hold'em Bot PM to leave your active table.`);
    return;
  }
  try {
    table.sitDown(message.author.id, buyIn || table.buyIn, seat ? seat - 1: undefined);
    await Promise.all([table.saveToDb(), table.render()]);
  } catch (err) {
    message.reply(err.message);
  }
}