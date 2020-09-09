import { Message, MessageEmbed } from "discord.js";
import { Account } from "../models";
import config from "../config";

const { DEFAULT_BANKROLL } = config;

export const command = ["bank [user]", "bankroll", "me", "account", "player"];

export const definition = "Show a user's bankroll.";

export const builder = yargs => yargs.positional("user", {
  description: "The user to show a bankroll for.",
  type: "string"
});

export async function handler ({ discord, user: mention }) {
  const message = discord.message as Message;
  const userId = mention?.match(/^<@!?(\d+)>$/)?.[1] ?? message.author.id;
  if (message.channel.type === "dm") {
    // TODO: List all bankrolls user has on every guild.
  } else {
    let account = await Account.findByIdAndGuild(userId, message.guild!.id);
    if (!account) {
      account = new Account(userId, message.guild!.id, parseInt(DEFAULT_BANKROLL));
      await account.saveToDb();
    }
    const accountEmbed = new MessageEmbed();
    // TODO: Fill out account embed. Get discord member to display name.
    await message.reply(accountEmbed);
  }
}