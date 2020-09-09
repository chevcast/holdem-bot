import { Message, MessageEmbed } from "discord.js";
import { Account } from "../models";
import config from "../config";
import { formatMoney } from "../utilities";

const { DEFAULT_BANKROLL } = config;

export const command = ["bankroll [user]", "bankrolls", "bank", "me", "account", "accounts"];

export const definition = "Show a user's bankroll.";

export const builder = yargs => yargs
  .positional("user", {
    description: "The user to show a bankroll for.",
    type: "string"
  });

export async function handler ({ discord, user: mention }) {
  const message = discord.message as Message;
  const userId = mention?.match(/^<@!?(\d+)>$/)?.[1] ?? message.author.id;
  const user = message.client.users.cache.get(userId);
  if (!user) {
    await message.reply("Invalid user specified.");
    return;
  }
  let accounts = await Account.findByPlayerId(userId);
  if (message.author.id === userId
    && message.guild
    && (!accounts 
      || accounts.filter(account =>
        account.guildId === message.guild!.id).length === 0))
  {
    const account = new Account(userId, message.guild.id, parseInt(DEFAULT_BANKROLL));
    await account.saveToDb();
    if (!accounts) accounts = [];
    accounts.push(account);
  }
  if (!accounts || accounts.length === 0) {
    await message.reply(`${user.username} does not yet have any bankrolls.`);
    return;
  }
  const accountsEmbed = new MessageEmbed()
    .setTitle(`${user.username}'s Bankrolls`)
    .setColor("#FDE15B")
    .setThumbnail(user.avatarURL({ format: "png" })!)
    .attachFiles(["./images/chevtek.png"])
    .setFooter("Created by Chevtek", "attachment://chevtek.png");
  for (const account of accounts) {
    const guild = message.client.guilds.cache.get(account.guildId); 
    if (!guild) throw new Error("Unable to find guild.");
    accountsEmbed.addField(`**${guild.name}**`, formatMoney(account.bankroll), true);
  }
  await message.reply(accountsEmbed);
  // let account = await Account.findByPlayerAndGuild(userId, message.guild!.id);
  // if (!account) {
  //   account = new Account(userId, message.guild!.id, parseInt(DEFAULT_BANKROLL));
  //   await account.saveToDb();
  // }
  // const member = message.guild!.members.cache.get(userId);
  // if (!member) throw new Error("Could not find server member.");
  // const accountEmbed = new MessageEmbed()
  //   .setTitle(`${member.guild.name}`)
  //   .setColor("#FDE15B")
  //   .setThumbnail(member.guild.iconURL({ format: "png" })!)
  //   .setDescription(`**${member.displayName}'s Bankroll:** ${formatMoney(account.bankroll)}`)
  //   .attachFiles(["./images/chevtek.png"])
  //   .setFooter("Created by Chevtek", "attachment://chevtek.png");
  // await message.reply(accountEmbed);
}