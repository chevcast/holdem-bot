import { Message, TextChannel } from "discord.js";
import { ChannelTable } from "../models";

export const command = "test";

export const description = false;

export async function handler ({ discord }) {
  const message = discord.message as Message;
  const table = new ChannelTable(message.author.id, message.channel as TextChannel);
  console.log(table);
  table.sitDown("Player 1", 3000);
  table.sitDown("Player 2", 2000);
  await table.saveToDb();

  const table2 = await ChannelTable.findByChannelId(message.channel.id);
  console.log(table2);

  // // message.channel.send("Does this work?", { tts: true });

  // const debug = async (obj) => message.channel.send(util.inspect(obj), { code: "js", split: true });

  // const table = new ChannelTable(message.author.id, message.channel as TextChannel, 100, 20, 10);

  // table.debug = true;

  // const id = message.author.id;
  // table.sitDown(id, 1000);
  // table.sitDown(id, 1000);
  // table.sitDown(id, 1000);
  // // table.sitDown(player4, 1000);
  // // table.sitDown(player5, 1000);
  
  // // table.players.forEach(player => player.showCards = true);

  // table.dealCards();

  // // pre-flop
  // table.currentActor!.callAction();
  // table.currentActor!.callAction();
  // table.currentActor!.checkAction();

  // // flop
  // table.currentActor!.checkAction();
  // table.currentActor!.checkAction();
  // table.currentActor!.checkAction();

  // // turn
  // table.currentActor!.checkAction();
  // table.currentActor!.checkAction();
  // table.currentActor!.checkAction();

  // // river
  // table.currentActor!.checkAction();
  // table.currentActor!.checkAction();
  // table.currentActor!.checkAction();

  // await debug(table.toJson());
  // // await debug(table.currentActor!.legalActions());
  // await table.render();
}