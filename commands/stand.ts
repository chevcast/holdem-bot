import { Message } from "discord.js";
import { Table, Account } from "../models";

export const command = ["stand [user]", "leave"];

export const description = "Leave the current game.";

export const builder = yargs => yargs
  .positional("user", {
    description: "The table creator can @mention a user to forcibly remove them from the table.",
    type: "string"
  });

export async function handler ({ discord, user }) {
  const message = discord.message as Message;
  let table = await Table.findByChannelId(message.channel.id);
  if (!table) {
    table = await Table.findByPlayerId(message.author.id);
    if (!table) {
      if (message.channel.type === "dm") {
        message.reply("You do not have an active Hold'em table.");
      } else {
        message.reply("There is no active Hold'em game in this channel.");
      }
      return;
    }
  }
  let userId: string|undefined = message.author.id;
  if (user) {
    if (message.author.id !== table.creatorId) {
      await message.reply("Only the table creator can forcibly remove a player.");
      return;
    }
    userId = user.match(/^<@!?(.+)>$/)?.[1];
    if (!userId) {
      userId = message.guild?.members.cache.find(member => member.displayName.toLowerCase() === user)?.id;
      if (!userId) {
        await message.reply("Invalid user specified.");
        return;
      }
    }
  }
  if (userId !== message.author.id) {
    await message.reply(`Are you sure you want to remove <@${userId}> from the table? (y/n)`);
  } else {
    await message.reply("Are you sure you want to leave the game? (y/n)")
  }
  try {
    const collected = await message.channel.awaitMessages(
      response => {
        if (response.author.id !== message.author.id) return false;
        return ["yes", "y", "no", "n"].includes(response.content.toLowerCase());
      },
      { max: 1, time: 20000, errors: ["time"] }
    );
    if (!["yes", "y"].includes(collected.first()!.content.toLowerCase())) return;
    if (table.currentActor?.id === message.author.id) {
      table.prompt?.resolve?.();
    }
    const playersThatStood = table.standUp(userId);
    const account = await Account.findByPlayerAndGuild(userId, table.channel.guild.id);
    if (!account) throw new Error("Cannot find account. Unable to return player stack.");
    if (!table.debug) {
      playersThatStood.forEach(({ stackSize }) => account.bankroll += stackSize);
    }
    await Promise.all([account.saveToDb(), table.render()]);
    const leftUser = message.client.users.cache.get(userId)!;
    if (message.author.id !== userId) {
      await Promise.all<any>([
        table.channel.send(`<@${userId}> has been removed from the table.`),
        ...table.players.filter(player => player !== null).map(async player => {
          const user = message.client.users.cache.get(player!.id);
          const channel = user!.dmChannel || await user!.createDM();
          await channel.send(`${leftUser.username} has been removed from the table.`);
        })
      ]);
    } else {
      await Promise.all<any>([
        message.reply("You have left your active Hold'em table."),
        table.channel.send(`<@${userId}> has left the table.`),
        ...table.players.filter(player => player !== null && player.id !== userId).map(async player => {
          const user = message.client.users.cache.get(player!.id);
          const channel = user!.dmChannel || await user!.createDM();
          await channel.send(`${leftUser.username} has left from the table.`);
        })
      ]);
    }
    const players = table.players.filter(player => player !== null);
    if (players.length > 0) {
      if (table.creatorId === userId) {
        const [newOwner] = players;
        table.creatorId = newOwner!.id;
        const ownerUser = message.client.users.cache.get(table.creatorId)!;
        const channel = ownerUser!.dmChannel || await ownerUser!.createDM();
        await Promise.all<any>([
          channel.send(`<@${table.creatorId}>, you are now the table owner.`),
          table.channel.send(`<@${table.creatorId}> is the new table owner.`),
          ...table.players.filter(player => player !== null && player.id !== table!.creatorId).map(async player => {
            const user = message.client.users.cache.get(player!.id);
            const channel = user!.dmChannel || await user!.createDM();
            await channel.send(`${ownerUser.username} is the new table owner.`);
          })
        ]);
      }
      await table.saveToDb();
    } else {
      await Promise.all([
        message.reply("No more players at the table. The table has been destroyed."),
        table.channel.send("No more players at the table. The table has been destroyed.")
      ]);
      await table.deleteFromDb();
    }
  } catch (err) {
    if (!err.message) {
      await message.reply("No confirmation received. You are still playing!");
    } else {
      await message.reply(err.message);
    }
  }
}