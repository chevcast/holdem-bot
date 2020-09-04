import { Message } from "discord.js";
import { ChannelTable } from "../models";

export const command = ["destroy", "finish", "end", "delete"];

export const description = "Destroy the current table for this channel.";

export async function handler ({ discord }) {
  const message = discord.message as Message;
  let table = await ChannelTable.findByChannelId(message.channel.id);
  if (!table) {
    table = await ChannelTable.findByCreatorId(message.author.id);
    if (!table) {
      if (message.channel.type === "dm") {
        message.reply("You do not have an active Hold'em table.");
      } else {
        message.reply("There is no active Hold'em game in this channel.");
      }
      return;
    }
  }
  // if (table.creatorId !== message.author.id) {
  //   message.reply("Only the table creator can destroy the table.");
  //   return;
  // }
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