import { Message } from "discord.js";
import { Table, Account } from "../models";
import config from "../config";
import { formatMoney } from "../utilities";

const {
  COMMAND_PREFIX,
  DEFAULT_BANKROLL
} = config;

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
    await message.reply("This command can only be run from a channel on a server.");
    return;
  }
  const table = await Table.findByChannelId(message.channel.id);
  if (!table) {
    await message.reply("There is no active Hold'em game in this channel.");
    return;
  }
  const existingTable = await Table.findByPlayerId(message.author.id);
  if (existingTable && table.channel.id !== existingTable.channel.id) {
    await message.reply(`You have already joined a table. Use \`${COMMAND_PREFIX}stand\` from your Hold'em Bot PM to leave your active table.`);
    return;
  }
  if (table.tournamentMode) {
    if (table.handNumber > 0) {
      await message.reply("This table is a tournament mode table. Joining after the first hand has begun is disallowed.");
      return;
    }
    if (buyIn && buyIn !== table.buyIn) {
      await message.reply(`You cannot buy into a tournament table for more than the minimum buy-in (${formatMoney(table.buyIn)}).`)
      return;
    }
  }
  if (buyIn && buyIn < table.buyIn) {
    await message.reply(`You cannot buy in for less than the minimum buy-in (${formatMoney(table.buyIn)}).`);
    return;
  }
  try {
    const stack = buyIn || table.buyIn;
    table.sitDown(message.author.id, stack, seat ? seat - 1: undefined);
    const account = (await Account.findByPlayerAndGuild(message.author.id, message.guild!.id))
      ?? new Account(
        message.author.id,
        message.guild!.id,
        parseInt(DEFAULT_BANKROLL),
        message.member!.displayName
      );
    if (account.bankroll < stack) {
      if (stack <= parseInt(DEFAULT_BANKROLL)) {
        account.bankroll = parseInt(DEFAULT_BANKROLL);
      } else {
        await message.reply("You do not have enough money to buy into this game.");
        return;
      }
    }
    if (!table.debug) {
      account.bankroll -= stack;
    }
    await Promise.all([table.saveToDb(), account.saveToDb(), table.render()]);
  } catch (err) {
    await message.reply(err.message);
  }
}