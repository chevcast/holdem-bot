import { Message, MessageEmbed } from "discord.js";
import discordClient from "../discord-client";

export const command = "hands";

export const description = "Show poker hand rankings.";

export async function handler ({ discord }) {
  const message = discord.message as Message;
  const embed = new MessageEmbed()
    .setTitle("Poker Hand Rankings")
    .setColor(0x00ff00)
    // .setThumbnail(discordClient.user!.avatarURL({ format: "png" })!)
    .attachFiles(["./images/poker-hands.jpg", "./images/chevtek.png"])
    .setImage("attachment://poker-hands.jpg")
    .setFooter("Created by Chevtek", "attachment://chevtek.png");
  message.reply(embed);
}