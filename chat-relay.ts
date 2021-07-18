import { Message, MessageEmbed } from "discord.js";
import { Table } from "./models";

export default async function (message: Message) {
  if (message.channel.type === "dm") {
    // Post in other DMs and channel.
    const table = await Table.findByPlayerId(message.author.id);
    if (!table) return;
    if (table.prompt && table.prompt.awaitMessages?.filter(message)) return;
    const member = table.channel.guild.members.cache.get(message.author.id);
    // Send to channel.
    table.channel.send(`**${member!.displayName}:** ${message.content}`, message.attachments.first());
    // Send to other players.
    const players = table.players
      .filter(player => player !== null && player.id !== message.author.id);
    for (const player of players) {
      try {
        const user = table.channel.guild.members.cache.get(player!.id)!.user;
        const channel = user.dmChannel || await user.createDM();
        channel.send(`**${member!.displayName}:** ${message.content}`, message.attachments.first());
      } catch (err) {
        table.standUp(player!.id);
      }
    }
  } else {
    // Post to all DMs.
    const table = await Table.findByChannelId(message.channel.id);
    if (!table) return;
    if (table.debug) {
      const user = table.channel.guild.members.cache.get(table.creatorId)!.user;
      const channel = user.dmChannel || await user.createDM();
      channel.send(`**${message.member!.displayName}:** ${message.content}`, message.attachments.first());
      return;
    }
    const players = table.players.filter(player => player !== null);
    for (const player of players) {
      try {
        const user = table.channel.guild.members.cache.get(player!.id)!.user;
        const channel = user.dmChannel || await user.createDM();
        channel.send(`**${message.member!.displayName}:** ${message.content}`, message.attachments.first());
      } catch (err) {
        table.standUp(player!.id);
      }
    }
  }
}