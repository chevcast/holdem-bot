import { Message, MessageEmbed } from "discord.js";
import { Account } from "../models";
import config from "../config";
import { formatMoney } from "../utilities";
import { format } from "path";

const { DEFAULT_BANKROLL } = config;

export const command = ["leadboard", "leader", "lb"];

export const definition = "Show all bankrolls on a server in descending order.";

export async function handler ({ discord }) {
  const message = discord.message as Message;
  if (message.channel.type === "dm") {
    message.reply("This command can only be run in a channel on a server.");
    return;
  }
  const accounts = await Account.findByGuildId(message.guild!.id);
  if (!accounts) {
    message.reply("Nobody on this sever has a bankroll.");
    return;
  }
  const newEmbed = () => new MessageEmbed()
    .setTitle(`${message.guild!.name} Leader Board`)
    .setColor("#FDE15B")
    .setThumbnail(message.guild!.iconURL({ format: "png" })!)
    .attachFiles(["./images/chevtek.png"])
    .setFooter("Created by Chevtek", "attachment://chevtek.png");
  let embed = newEmbed();
  for (const account of accounts) {
    if (embed.length > 1900) {
      message.reply(embed);
      embed = newEmbed();
    }
    const member = message.guild!.members.cache.get(account.playerId)!;
    embed.addField(`**${member.displayName}**`, formatMoney(account.bankroll));
  }
  await message.reply(embed);
}