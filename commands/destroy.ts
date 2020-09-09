import { Message } from "discord.js";
import { Table, Account } from "../models";

export const command = ["destroy", "finish", "end", "delete"];

export const description = "Destroy the current table for this channel.";

export async function handler ({ discord }) {
  const message = discord.message as Message;
  if (message.channel.type === "dm") {
    await message.reply("This command can only be run from a channel on a server.");
    return;
  }
  let table = await Table.findByChannelId(message.channel.id);
  if (!table) {
    await message.reply("There is no active Hold'em game in this channel.");
    return;
  }
  try {
    await message.reply("Are you sure? Type `CONFIRM` to destroy the table.");
    await message.channel.awaitMessages(
      response => {
        if (response.author.id !== message.author.id) return false;
        return response.content === "CONFIRM";
      },
      { max: 1, time: 15000, errors: ["time"] }
    );
    await Promise.all(table.players.map(async player => {
      if (!player) return;
      const account = await Account.findByIdAndGuild(player.id, table!.channel.guild.id);
      if (!account) {
        await message.reply(`Unable to find player ${player.id} in DB. Unable to return stack.`);
        return;
      }
      account.bankroll += player.stackSize;
      return account.saveToDb();
    }));
    table.prompt?.resolve?.();
    await table.deleteFromDb();
    await message.reply("The Hold'em table for this channel has been deleted.");
  } catch (err) {
    await message.reply("No confirmation received. The table was not destroyed.");
  }
}