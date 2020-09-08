import { Message } from "discord.js";
import { PokerTable } from "./models";

export default async function (message: Message) {
  if (message.channel.type === "dm") {
    // Post in other DMs and channel.
    const table = await PokerTable.findByPlayerId(message.author.id);
    if (!table) return;
    if (table?.prompt?.userId === message.author.id) {
      return;
    }
    const member = table.channel.guild.members.cache.get(message.author.id);
    // Send to channel.
    table.channel.send(`**${member!.displayName}:** ${message.content}`);
    // Send to other players.
    const players = table.players
      .filter(player => player !== null && player.id !== message.author.id);
    for (const player of players) {
      const user = table.channel.guild.members.cache.get(player!.id)!.user;
      const channel = user.dmChannel || await user.createDM();
      channel.send(`**${member!.displayName}:** ${message.content}`);
    }
  } else {
    // Post to all DMs.
    const table = await PokerTable.findByChannelId(message.channel.id);
    if (!table) return;
    if (table.debug) {
      const user = table.channel.guild.members.cache.get(table.creatorId)!.user;
      const channel = user.dmChannel || await user.createDM();
      channel.send(`**${message.member!.displayName}:** ${message.content}`);
      return;
    }
    const players = table.players.filter(player => player !== null);
    for (const player of players) {
      const user = table.channel.guild.members.cache.get(player!.id)!.user;
      const channel = user.dmChannel || await user.createDM();
      channel.send(`**${message.member!.displayName}:** ${message.content}`);
    }
  }
}