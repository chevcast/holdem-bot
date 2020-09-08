import { Message } from "discord.js";
import { PokerTable } from "../models";

export const command = ["destroy", "finish", "end", "delete"];

export const description = "Destroy the current table for this channel.";

export async function handler ({ discord }) {
  const message = discord.message as Message;
  if (message.channel.type === "dm") {
    message.reply("This command can only be run from a channel on a server.");
    return;
  }
  let table = await PokerTable.findByChannelId(message.channel.id);
  if (!table) {
    message.reply("There is no active Hold'em game in this channel.");
    return;
  }
  try {
    message.reply("Are you sure? Type `CONFIRM` to destroy the table.");
    await message.channel.awaitMessages(
      response => {
        if (response.author.id !== message.author.id) return false;
        return response.content === "CONFIRM";
      },
      { max: 1, time: 15000, errors: ["time"] }
    );
    table.prompt?.resolve?.();
    await table.deleteFromDb();
    message.reply("The Hold'em table for this channel has been deleted.");
  } catch (err) {
    message.reply("No confirmation received. The table was not destroyed.");
  }
}