import fs from "fs";
import util from "util";
import path from "path";
import {
  VoiceConnection,
  MessageAttachment,
  Message,
  MessageEmbed,
  TextChannel,
  Collection,
  MessageReaction,
} from "discord.js";
import { Table, Card, Player, Pot } from "@chevtek/poker-engine";
import { renderPokerTable } from "../drawing-utils";
import { formatMoney } from "../utilities";
import { Prompt } from "./Prompt";
import config from "../config";
import db from "../db";
import discordClient from "../discord-client";
import { table } from "console";

const readDir = util.promisify(fs.readdir);

const {
  COMMAND_PREFIX,
  RARE_SOUND_SKIP_FRACTION
} = config;

const tableCache: {[key: string]: Table} = {};

export class ChannelTable extends Table {

  voiceConnection?: VoiceConnection
  voiceTimeout?: NodeJS.Timeout
  prompt?: Prompt
  sound = true

  constructor(
    public creatorId: string,
    public channel: TextChannel,
    minBuyIn?: number,
    smallBlind?: number,
    bigBlind?: number
  ) {
    super(minBuyIn, smallBlind, bigBlind);
  }

  async createPrompt(prompt: Prompt) {
    if (!prompt.awaitReactions && !prompt.awaitMessages) {
      throw new Error("You must provide a message or reaction collector.");
    }
    const user = this.channel.guild!.members.cache.get(prompt.userId)!.user;
    const channel = user!.dmChannel || await user!.createDM();
    const newPrompt: Prompt = {...prompt};
    const newMessage = await channel.send(prompt.text);
    if (prompt.reactions) {
      prompt.reactions.forEach(reaction => newMessage.react(reaction));
    }
    newPrompt.promise = new Promise<Collection<string, Message> | Collection<string, MessageReaction>>((resolve, reject) => {
      let discordPromise: Promise<Collection<string, Message> | Collection<string, MessageReaction>>;
      if (prompt.awaitMessages && prompt.awaitReactions) {
        discordPromise = Promise.race([
          newMessage.channel.awaitMessages(prompt.awaitMessages.filter, prompt.awaitMessages.options),
          newMessage.awaitReactions(prompt.awaitReactions.filter, prompt.awaitReactions.options)
        ]);
      } else if (prompt.awaitMessages) {
        discordPromise = newMessage.channel.awaitMessages(prompt.awaitMessages.filter, prompt.awaitMessages.options);
      } else if (prompt.awaitReactions) {
        discordPromise = newMessage.awaitReactions(prompt.awaitReactions.filter, prompt.awaitReactions.options);
      }
      discordPromise!.then(resolve).catch(reject);
      newPrompt.resolve = resolve;
      newPrompt.reject = reject;
    });

    if (prompt.promise) {
      newPrompt.promise.then(prompt.resolve).catch(prompt.reject);
    }

    return this.prompt = newPrompt;
  }

  async playRandomSound (directory: string) {
    if (!this.sound) return;
    if (this.voiceTimeout) {
      clearTimeout(this.voiceTimeout);
      delete this.voiceTimeout;
    }
    const tableCreator = this.channel.guild?.members.cache.get(this.creatorId);
    if ((!this.voiceConnection || this.voiceConnection.status === 4) && tableCreator?.voice.channel) {
      this.voiceConnection = await tableCreator?.voice.channel.join();
    } else if (this.voiceConnection && !tableCreator?.voice.channel) {
      this.voiceConnection.disconnect();
      delete this.voiceConnection;
      return;
    }
    this.voiceTimeout = setTimeout(() => {
      this.voiceConnection?.disconnect();
      delete this.voiceConnection;
      delete this.voiceTimeout;
      console.log("Voice connection timeout.");
    }, 60000);
    if (!this.voiceConnection) return;
    const files = (await readDir(directory)).filter(file => file !== "rare");
    let soundPath = path.join(directory, files[Math.floor(Math.random() * files.length)]);
    if (Math.floor(Math.random() * parseInt(RARE_SOUND_SKIP_FRACTION)) === 0) {
      try {
        const rareFiles = await readDir(path.join(directory, "rare"));
        if (rareFiles.length > 0) {
          soundPath = path.join(directory, "rare", rareFiles[Math.floor(Math.random() * rareFiles.length)]);
        }
      } catch (err) {}
    }
    return new Promise((resolve, reject) => this.voiceConnection!.play(soundPath).on("finish", resolve).on("error", reject));
  }

  async render () {
    const generateGameEmbed = async () => {
      const pokerTable = new MessageAttachment(
        await renderPokerTable(this),
        "pokerTable.png"
      );
      const gameEmbed = new MessageEmbed()
        .setTitle(`Hold'em Table - #${this.channel.name}`)
        .setDescription(`
          **Buy-in:** ${formatMoney(this.buyIn)}
          **Players:** ${this.players.filter(player => player !== null).length}

          > **Type \`${COMMAND_PREFIX}sit\` to play!**
        `.split("\n").map(line => line.trim()).join("\n"))
        .setColor(0x00ff00)
        .setImage("attachment://pokerTable.png")
        .setThumbnail(discordClient.user!.avatarURL({ format: "png" })!)
        .attachFiles([pokerTable, "./images/chevtek.png"])
        .setFooter("Created by Chevtek", "attachment://chevtek.png");
      const sidePots = this.sidePots;
      if (sidePots) {
        gameEmbed.addFields(sidePots.map((pot, index) => {
          const players = pot.winners ? pot.winners : pot.eligiblePlayers;
          return {
            name: index === 0 ? "Main Pot" : `Side Pot ${index + 1}`,
            value: `
              **Amount:** ${formatMoney(pot.amount)}
              **${pot.winners ? "Winners:" : "Players:"}** ${players.map(player => `<@${player.id}>`).join(", ")}
            `.split("\n").map(line => line.trim()).join("\n")
          };
        }));
      }
      return gameEmbed;
    };
    await this.channel.send(await generateGameEmbed());
    if (this.debug) {
      this.players.forEach(player => {
        if (!player) return;
        player.showCards = true
      });
      const user = this.channel.guild!.members.cache.get(this.creatorId)!.user;
      await user.send(await generateGameEmbed());
      return;
    } else if (!this.currentRound && this.handNumber === 0) {
      return;
    }
    for (let index = 0; index < this.players.length; index++) {
      const player = this.players[index];
      if (!player) continue;
      const oldValue = player.showCards;
      player.showCards = true;
      const user = this.channel.guild!.members.cache.get(player.id)!.user;
      await user.send(await generateGameEmbed());
      player.showCards = oldValue;
    }
  }

  saveToDb() {
    const { pokerTables } = db;
    if (!pokerTables) throw new Error("Unable to save poker table. No database container.");
    if (!tableCache[this.channel.id]) {
      tableCache[this.channel.id] = this;
    }
    const doc = {
      id: this.channel.id,
      autoMoveDealer: this.autoMoveDealer,
      bigBlind: this.bigBlind,
      bigBlindPosition: this.bigBlindPosition,
      buyIn: this.buyIn,
      communityCards: this.communityCards.map(card => ({
        rank: card.rank,
        suit: card.suit
      })),
      creatorId: this.creatorId,
      currentBet: this.currentBet,
      currentPosition: this.currentPosition,
      currentRound: this.currentRound,
      dealerPosition: this.dealerPosition,
      debug: this.debug,
      deck: this.deck.map(card => ({
        rank: card.rank,
        suit: card.suit
      })),
      handNumber: this.handNumber,
      lastPosition: this.lastPosition,
      lastRaise: this.lastRaise,
      players: this.players
        .map(player => player === null ? null : ({
          bet: player.bet,
          folded: player.folded,
          holeCards: player.holeCards?.map(card => ({
            rank: card.rank,
            suit: card.suit
          })),
          id: player.id,
          left: player.left,
          raise: player.raise,
          showCards: player.showCards,
          stackSize: player.stackSize
        })),
      pots: this.pots.map(pot => ({
        amount: pot.amount,
        eligiblePlayers: pot.eligiblePlayers.map(player => player.id),
        winners: pot.winners?.map(player => player.id)
      })),
      smallBlind: this.smallBlind,
      smallBlindPosition: this.smallBlindPosition,
      sound: this.sound,
      winners: this.winners?.map(player => player.id)
    };
    return pokerTables.items.upsert(doc);
  }

  deleteFromDb () {
    const { pokerTables } = db;
    if (!pokerTables) throw new Error("Unable to delete table. No container found.");
    if (tableCache[this.channel.id]) {
      delete tableCache[this.channel.id];
    }
    return pokerTables.item(this.channel.id).delete();
  }

  populateFromDoc(doc: any) {
    const players = doc.players.map(data => {
      if (data === null) return null;
      const player = new Player(data.id, data.stackSize, this);
      Object.assign(player, data, {
        holeCards: data.holeCards?.map(card => new Card(card.rank, card.suit))
      });
      return player;
    });
    Object.assign(this, doc, {
      communityCards: doc.communityCards
        .map(card => new Card(card.rank, card.suit)),
      deck: doc.deck
        .map(card => new Card(card.rank, card.suit)),
      players,
      pots: doc.pots.map(data => {
        const pot = new Pot();
        pot.amount = data.amount;
        pot.eligiblePlayers = data.eligiblePlayers
          .map(playerId => players
            .filter(player => player && player.id === playerId)[0]);
        pot.winners = data.winners
          ?.map(playerId => players
            .filter(player => player && player.id === playerId)[0]);
        return pot;
      }),
      winners: doc.winners
        ?.map(playerId => players
          .filter(player => player && player.id === playerId)[0])
    });
    return this;
  }

  static async findByChannelId(channelId: string) {
    const { pokerTables } = db;
    if (!pokerTables) throw new Error("Unable to find table. No poker table container.");
    if (tableCache[channelId]) {
      return tableCache[channelId];
    }
    const { resource: doc } = await pokerTables.item(channelId).read();
    if (!doc) return;
    const channel = discordClient.channels.cache.get(doc.id)! as TextChannel;
    const table = (new ChannelTable(doc.creatorId, channel)).populateFromDoc(doc);
    if (!tableCache[channelId]) {
      tableCache[channelId] = table;
    }
    return table;
  }

  static async findByPlayerId(playerId: string) {
    const { pokerTables } = db;
    if (!pokerTables) throw new Error("Unable to find table. No poker table container.");
    for (const channelId in tableCache) {
      const table = tableCache[channelId];
      const playerMatches = table.players.filter(player => player && player.id === playerId);
      if (playerMatches.length > 0) {
        return table;
      }
    }
    const { resources } = await pokerTables.items.query({
      query: "SELECT DISTINCT c FROM c JOIN pc IN c.players WHERE pc.id IN (@playerId)",
      parameters: [
        { name: "@playerId", value: playerId }
      ]
    }).fetchAll();
    if (!resources || resources.length === 0) return;
    const [{ c: doc }] = resources;
    const channel = discordClient.channels.cache.get(doc.id)! as TextChannel;
    const table = (new ChannelTable(doc.creatorId, channel)).populateFromDoc(doc);
    if (!tableCache[channel.id]) {
      tableCache[channel.id] = table;
    }
    return table;
  }
}