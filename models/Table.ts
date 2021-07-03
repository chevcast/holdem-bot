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
import { Table as TableBase, Card, Player, Pot } from "@chevtek/poker-engine";
import { renderPokerTable } from "../drawing-utils";
import { formatMoney } from "../utilities";
import config from "../config";
import db from "../db";
import discordClient from "../discord-client";
import { Account, Prompt } from ".";

const readDir = util.promisify(fs.readdir);

const {
  COMMAND_PREFIX,
  RARE_SOUND_SKIP_FRACTION
} = config;

const tableCache: { [key: string]: Table } = {};

export class Table extends TableBase {

  autoDestructTimer: number = 0;
  autoDestructTimeout?: NodeJS.Timeout;
  blindIncreaseInterval?: NodeJS.Timeout;
  blindIncreaseTimer: number = 0;
  prompt?: Prompt;
  sound = true;
  tournamentMode: boolean = false;
  turnTimer: number = 0;
  voiceConnection?: VoiceConnection;
  voiceTimeout?: NodeJS.Timeout;

  constructor(
    public creatorId: string,
    public channel: TextChannel,
    minBuyIn?: number,
    smallBlind?: number,
    bigBlind?: number
  ) {
    super(minBuyIn, smallBlind, bigBlind);
  }

  dealCards() {
    if (this.blindIncreaseTimer > 0 && this.handNumber === 0) {
      this.startBlindTimer();
    }
    super.dealCards();
  }

  async startBlindTimer() {
    await this.channel.send(`Blinds will double in **${this.blindIncreaseTimer} minutes**.`);
    await Promise.all(this.players.filter(p => p !== null).map(async player => {
      const user = this.channel.guild.members.cache.get(player!.id)!.user;
      const channel = user.dmChannel || await user.createDM();
      await channel.send(`Blinds will double in **${this.blindIncreaseTimer} minutes**.`);
    }));
    this.blindIncreaseInterval = setInterval(async () => {
      try {
        this.smallBlind *= 2;
        this.bigBlind *= 2;
        await this.channel.send(`Blinds have been increased to **${formatMoney(this.smallBlind)}/${formatMoney(this.bigBlind)}**!`);
        await Promise.all(this.players.filter(p => p !== null).map(async player => {
          const user = this.channel.guild.members.cache.get(player!.id)!.user;
          const channel = user.dmChannel || await user.createDM();
          await channel.send(`Blinds have been increased to **${formatMoney(this.smallBlind)}/${formatMoney(this.bigBlind)}**!`);
        }));
        await this.saveToDb();
      } catch (err) {
        await this.channel.send(err.message);
      }
    }, this.blindIncreaseTimer * 60 * 1000);
  }

  async createPrompt(prompt: Prompt) {
    if (!prompt.awaitReactions && !prompt.awaitMessages) {
      throw new Error("You must provide a message or reaction collector.");
    }
    const user = this.channel.guild!.members.cache.get(prompt.userId)!.user;
    const channel = user!.dmChannel || await user!.createDM();
    const newPrompt: Prompt = { ...prompt };
    const newMessage = await channel.send(prompt.text);
    if (prompt.reactions) {
      prompt.reactions.forEach(reaction => newMessage.react(reaction));
    }
    newPrompt.promise = (new Promise<string | undefined>((resolve, reject) => {
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
      discordPromise!.then(collected => {
        const response = collected.first()!;
        if (!response) return;
        return (<MessageReaction>response)?.emoji?.id ?? (<Message>response).content;
      }).then(resolve).catch(reject);
      newPrompt.resolve = resolve;
      newPrompt.reject = reject;
    }));

    if (this.turnTimer > 0) {
      if (prompt.timerIntervalId) {
        clearInterval(prompt.timerIntervalId);
      }
      newPrompt.remainingTime = prompt.remainingTime ?? this.turnTimer;
      const content = newMessage.content;
      const interval = 5;
      newPrompt.timerIntervalId = setInterval(() => {
        newPrompt.remainingTime! -= interval;
        if (newPrompt.remainingTime! > 30) return;
        newMessage.edit(`${content}\n**${newPrompt.remainingTime!}** seconds remaining.`);
        if (newPrompt.remainingTime === 0) {
          clearInterval(newPrompt.timerIntervalId!);
          if (this.currentActor?.legalActions().includes("check")) {
            newPrompt.resolve?.("check");
          } else {
            newPrompt.resolve?.("fold");
          }
        }
      }, interval * 1000);
    }

    newPrompt.promise!.then(response => {
      if (newPrompt.timerIntervalId) {
        clearInterval(newPrompt.timerIntervalId);
      }
      prompt.resolve?.(response);
    }).catch(prompt.reject);

    return this.prompt = newPrompt;
  }

  beginAutoDestructSequence() {
    if (this.autoDestructTimeout) {
      clearTimeout(this.autoDestructTimeout);
    }
    if (this.autoDestructTimer) {
      this.autoDestructTimeout = setTimeout(async () => {
        try {
          await this.channel.send(`The Hold'em table in this channel has been idle for ${this.autoDestructTimer} minutes and has self-destructed.`);
          if (this.debug) {
            const user = this.channel.guild.members.cache.get(this.creatorId)?.user;
            const channel = user?.dmChannel || await user?.createDM();
            if (channel) {
              await channel.send(`Your active Hold'em table has been idle for ${this.autoDestructTimer} minutes and has self-destructed.`);
            }
          } else {
            for (const player of this.players) {
              if (player === null) continue;
              const user = this.channel.guild.members.cache.get(player.id)?.user;
              const channel = user?.dmChannel || await user?.createDM();
              if (!channel) continue;
              await channel.send(`Your active Hold'em table has been idle for ${this.autoDestructTimer} minutes and has self-destructed.`);
            }
          }
          for (const player of this.players) {
            if (!player) continue;
            const account = await Account.findByPlayerAndGuild(player.id, this.channel.guild.id);
            if (!account) {
              await this.channel.send(`Unable to find player ${player.id} in DB. Unable to return stack.`);
              return;
            }
            account.bankroll += player.stackSize;
            await account.saveToDb();
          };
          await this.deleteFromDb();
        } catch (err) {
          console.log(err);
        }
      }, this.autoDestructTimer * 60 * 1000);
    }
  }

  async playRandomSound(directory: string, volume: number = 1) {
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
    }, 3 * 60 * 1000);
    if (!this.voiceConnection) return;
    const files = (await readDir(directory)).filter(file => file !== "rare");
    let soundPath = path.join(directory, files[Math.floor(Math.random() * files.length)]);
    if (Math.floor(Math.random() * parseInt(RARE_SOUND_SKIP_FRACTION)) === 0) {
      try {
        const rareFiles = await readDir(path.join(directory, "rare"));
        if (rareFiles.length > 0) {
          soundPath = path.join(directory, "rare", rareFiles[Math.floor(Math.random() * rareFiles.length)]);
        }
      } catch (err) { }
    }
    return new Promise((resolve, reject) => this.voiceConnection!.play(soundPath, { volume }).on("finish", resolve).on("error", reject));
  }

  async render() {
    const generateGameEmbed = async (currentPlayer?: Player) => {
      const pokerTable = new MessageAttachment(
        await renderPokerTable(this, currentPlayer),
        "pokerTable.png"
      );
      let color = "#FDE15B";
      if (this.debug) {
        color = "#FF5E13";
      } else if (this.currentRound && this.currentActor === currentPlayer) {
        color = "#00FF00";
      }
      const gameEmbed = new MessageEmbed()
        .setTitle(`${this.tournamentMode ? "Tournament" : "Cash"} Table\n${this.channel.guild.name}\n#${this.channel.name}`)
        .setDescription(`
          **Buy-in:** ${formatMoney(this.buyIn)}
          **Blinds:** ${formatMoney(this.smallBlind)}/${formatMoney(this.bigBlind)}
          **Players:** ${this.players.filter(player => player !== null).length}

          > **Type \`${COMMAND_PREFIX}sit\` to play!**
        `.split("\n").map(line => line.trim()).join("\n"))
        .setColor(color)
        .setThumbnail(discordClient.user!.avatarURL({ format: "png" })!)
        .attachFiles([pokerTable, "./images/chevtek.png"])
        .setImage("attachment://pokerTable.png")
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
    for (const player of this.players.filter(player => player !== null)) {
      if (!player) continue;
      const user = this.channel.guild!.members.cache.get(player.id)!.user;
      await user.send(await generateGameEmbed(player));
    }
  }

  async saveToDb() {
    const { TableModel } = db;
    if (!TableModel) throw new Error("Unable to save poker table. No database container.");
    tableCache[this.channel.id] = this;
    const doc = {
      autoMoveDealer: this.autoMoveDealer,
      bigBlind: this.bigBlind,
      bigBlindPosition: this.bigBlindPosition,
      blindIncreaseTimer: this.blindIncreaseTimer,
      buyIn: this.buyIn,
      channelId: this.channel.id,
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
      turnTimer: this.turnTimer,
      winners: this.winners?.map(player => player.id),
    };
    const existingTable = await Table.findByChannelId(this.channel.id);
    return existingTable ? TableModel.updateOne({ channelId: this.channel.id }, doc) : TableModel.create(doc);
  }

  deleteFromDb() {
    const { TableModel } = db;
    if (!TableModel) throw new Error("Unable to delete table. No container found.");
    if (this.autoDestructTimeout) {
      clearTimeout(this.autoDestructTimeout);
    }
    if (this.blindIncreaseInterval) {
      clearInterval(this.blindIncreaseInterval);
    }
    delete this.currentRound;
    this.cleanUp();
    this.prompt?.resolve?.();
    if (tableCache[this.channel.id]) {
      delete tableCache[this.channel.id];
    }
    return TableModel.findOneAndDelete({ channelId: this.channel.id });
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
    const { TableModel } = db;
    if (!TableModel) throw new Error("Unable to find table. No poker table container.");
    if (tableCache[channelId]) {
      return tableCache[channelId];
    }
    const doc = await TableModel.findOne({ channelId });
    if (!doc) return;
    const channel = discordClient.channels.cache.get(channelId) as TextChannel;
    if (!channel) {
      if (tableCache[channelId]) {
        delete tableCache[channelId];
      }
      return TableModel.findByIdAndDelete(channelId);
    }
    const table = (new Table(doc.creatorId, channel)).populateFromDoc(doc);
    if (!tableCache[channelId]) {
      tableCache[channelId] = table;
    }
    if (table.blindIncreaseTimer && table.blindIncreaseTimer > 0 && table.handNumber > 0) {
      table.startBlindTimer();
    }
    return table;
  }

  static async findByPlayerId(playerId: string) {
    const { TableModel } = db;
    if (!TableModel) throw new Error("Unable to find table. No poker table container.");
    for (const channelId in tableCache) {
      const table = tableCache[channelId];
      const playerMatches = table.players.filter(player => player && player.id === playerId);
      if (playerMatches.length > 0) {
        return table;
      }
    }
    const doc = await TableModel.find({ playerId });
    if (!doc || doc.length === 0) return;
    const channel = discordClient.channels.cache.get(doc.id)! as TextChannel;
    if (!channel) {
      if (tableCache[doc.id]) {
        delete tableCache[doc.id];
      }
      return TableModel.findByIdAndDelete(doc.id);
    }
    const table = (new Table(doc.creatorId, channel)).populateFromDoc(doc);
    if (!tableCache[channel.id]) {
      tableCache[channel.id] = table;
    }
    if (table.blindIncreaseTimer && table.blindIncreaseTimer > 0 && table.handNumber > 0) {
      table.startBlindTimer();
    }
    return table;
  }
}