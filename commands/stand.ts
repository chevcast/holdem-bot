import { Message } from "discord.js";
import { ChannelTable } from "../models";

export const command = ["stand", "leave"];

export const description = "Leave the current game.";

export async function handler ({ discord }) {
  const message = discord.message as Message;
  let table = await ChannelTable.findByChannelId(message.channel.id);
  if (!table) {
    table = await ChannelTable.findByPlayerId(message.author.id);
    if (!table) {
      if (message.channel.type === "dm") {
        message.reply("You do not have an active Hold'em table.");
      } else {
        message.reply("There is no active Hold'em game in this channel.");
      }
      return;
    }
  }
  message.reply("Are you sure you want to leave the game? (y/n)")
  try {
    const collected = await message.channel.awaitMessages(
      response => {
        if (response.author.id !== message.author.id) return false;
        return ["yes", "y", "no", "n"].includes(response.content.toLowerCase());
      },
      { max: 1, time: 20000, errors: ["time"] }
    );
    if (!["yes", "y"].includes(collected.first()!.content.toLowerCase())) return;
    table.standUp(message.author.id);
    await Promise.all([table.saveToDb(), table.render()]);
    message.reply("You have left your active Hold'em table.");
  } catch (err) {
    message.reply("No confirmation received. You are still playing!");
  }
}