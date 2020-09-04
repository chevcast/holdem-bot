import { Message } from "discord.js";
import { gameLoop } from "../utilities";
import { ChannelTable } from "../models";

export const command = ["refresh", "resume", "r"];

export const description = "Resume the Hold'em game in this channel if it was paused.";

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
  gameLoop(table);
}