import { Message } from "discord.js";
import { gameLoop } from "../utilities";
import { Table } from "../models";

export const command = ["deal", "d", "start", "begin"];

export const description = "Deal the cards!";

export async function handler ({ discord }) {
  const message = discord.message as Message;
  let table = await Table.findByChannelId(message.channel.id);
  if (!table) {
    table = await Table.findByPlayerId(message.author.id);
    if (!table) {
      if (message.channel.type === "dm") {
        await message.reply("You do not have an active Hold'em table.");
      } else {
        await message.reply("There is no active Hold'em game in this channel.");
      }
      return;
    }
  }
  if (![table.creatorId, table.dealer?.id].includes(message.author.id)){
    await message.reply("Only the current dealer or table creator can deal the cards.")
    return;
  }

  try {
    table.dealCards();
    await table.saveToDb();
    (async () => {
      for (let index = 0; index < table.activePlayers.length * 2; index++) {
        await table.playRandomSound("./sounds/deal");
      }
    })();
    gameLoop(table);
    await table.channel.send("Cards have been dealt. Visit your DMs to play! <https://discord.com/channels/@me>");
  } catch (err) {
    await message.reply(err.message);
  }
}
