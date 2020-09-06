import { Message, MessageEmbed } from "discord.js";
import discordClient from "../discord-client";
import { SuitEmoji, RankEmoji } from "../models";

export const command = "hands";

export const description = "Show poker hand rankings.";

export async function handler ({ discord }) {
  const message = discord.message as Message;
  const embed = new MessageEmbed()
    .setTitle("Poker Hand Rankings")
    .setColor(0x00ff00)
    .setThumbnail(discordClient.user!.avatarURL({ format: "png" })!)
    .addField(
      "Royal Flush",
      `
        _(1 in 649,739)_
        ${RankEmoji.TEN_RED}${RankEmoji.JACK_RED}${RankEmoji.QUEEN_RED}${RankEmoji.KING_RED}${RankEmoji.ACE_RED}
        ${SuitEmoji.HEART}${SuitEmoji.HEART}${SuitEmoji.HEART}${SuitEmoji.HEART}${SuitEmoji.HEART}
      `.split("\n").map(line => line.trimStart()).join("\n")
    )
    .addField(
      "Straight Flush",
      `
        _(1 in 72,193)_
        ${RankEmoji.SIX_BLACK}${RankEmoji.SEVEN_BLACK}${RankEmoji.EIGHT_BLACK}${RankEmoji.NINE_BLACK}${RankEmoji.TEN_BLACK}
        ${SuitEmoji.CLUB}${SuitEmoji.CLUB}${SuitEmoji.CLUB}${SuitEmoji.CLUB}${SuitEmoji.CLUB}
      `.split("\n").map(line => line.trimStart()).join("\n")
    )
    .addField(
      "Four of a Kind",
      `
        _(1 in 4,164)_
        ${RankEmoji.QUEEN_RED}${RankEmoji.QUEEN_RED}${RankEmoji.QUEEN_BLACK}${RankEmoji.QUEEN_RED}${RankEmoji.SEVEN_RED}
        ${SuitEmoji.DIAMOND}${SuitEmoji.HEART}${SuitEmoji.SPADE}${SuitEmoji.CLUB}${SuitEmoji.DIAMOND}
      `.split("\n").map(line => line.trimStart()).join("\n")
    )
    .addField(
      "Full House",
      `
        _(1 in 693)_
        ${RankEmoji.TEN_RED}${RankEmoji.TEN_BLACK}${RankEmoji.TEN_RED}${RankEmoji.SEVEN_BLACK}${RankEmoji.SEVEN_RED}
        ${SuitEmoji.DIAMOND}${SuitEmoji.CLUB}${SuitEmoji.HEART}${SuitEmoji.CLUB}${SuitEmoji.DIAMOND}
      `.split("\n").map(line => line.trimStart()).join("\n")
    )
    .addField(
      "Flush",
      `
        _(1 in 508)_
        ${RankEmoji.TWO_RED}${RankEmoji.FOUR_RED}${RankEmoji.SIX_RED}${RankEmoji.NINE_RED}${RankEmoji.TEN_RED}
        ${SuitEmoji.DIAMOND}${SuitEmoji.DIAMOND}${SuitEmoji.DIAMOND}${SuitEmoji.DIAMOND}${SuitEmoji.DIAMOND}
      `.split("\n").map(line => line.trimStart()).join("\n")
    )
    .addField(
      "Straight",
      `
        _(1 in 254)_
        ${RankEmoji.TWO_BLACK}${RankEmoji.THREE_BLACK}${RankEmoji.FOUR_RED}${RankEmoji.FIVE_BLACK}${RankEmoji.SIX_RED}
        ${SuitEmoji.SPADE}${SuitEmoji.CLUB}${SuitEmoji.HEART}${SuitEmoji.SPADE}${SuitEmoji.HEART}
      `.split("\n").map(line => line.trimStart()).join("\n")
    )
    .addField(
      "Three of a Kind",
      `
        _(1 in 46)_
        ${RankEmoji.SEVEN_RED}${RankEmoji.SEVEN_BLACK}${RankEmoji.SEVEN_RED}${RankEmoji.FIVE_BLACK}${RankEmoji.ACE_RED}
        ${SuitEmoji.DIAMOND}${SuitEmoji.CLUB}${SuitEmoji.HEART}${SuitEmoji.SPADE}${SuitEmoji.HEART}
      `.split("\n").map(line => line.trimStart()).join("\n")
    )
    .addField(
      "Two Pair",
      `
        _(1 in 20)_
        ${RankEmoji.KING_BLACK}${RankEmoji.KING_BLACK}${RankEmoji.SIX_RED}${RankEmoji.SIX_BLACK}${RankEmoji.TWO_BLACK}
        ${SuitEmoji.SPADE}${SuitEmoji.CLUB}${SuitEmoji.DIAMOND}${SuitEmoji.CLUB}${SuitEmoji.CLUB}
      `.split("\n").map(line => line.trimStart()).join("\n")
    )
    .addField(
      "One Pair",
      `
        _(1 in 2)_
        ${RankEmoji.ACE_BLACK}${RankEmoji.ACE_RED}${RankEmoji.FOUR_BLACK}${RankEmoji.SEVEN_RED}${RankEmoji.THREE_RED}
        ${SuitEmoji.CLUB}${SuitEmoji.HEART}${SuitEmoji.CLUB}${SuitEmoji.HEART}${SuitEmoji.DIAMOND}
      `.split("\n").map(line => line.trimStart()).join("\n")
    )
    .addField(
      "High Card",
      `
        _(1 in 1)_
        ${RankEmoji.TEN_RED}${RankEmoji.FIVE_RED}${RankEmoji.NINE_RED}${RankEmoji.THREE_BLACK}${RankEmoji.FIVE_BLACK}
        ${SuitEmoji.DIAMOND}${SuitEmoji.DIAMOND}${SuitEmoji.HEART}${SuitEmoji.CLUB}${SuitEmoji.SPADE}
      `.split("\n").map(line => line.trimStart()).join("\n")
    )
    .attachFiles(["./images/chevtek.png"])
    .setFooter("Created by Chevtek", "attachment://chevtek.png");
  message.reply(embed);
}