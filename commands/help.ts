import { MessageEmbed, Message } from "discord.js";

import fs from "fs";
import util from "util";
import discordClient from "../discord-client";

const readFile = util.promisify(fs.readFile);

export const command = ["help", "h"];

export const description = "Show all available commands.";

export async function handler ({ discord }) {
  const message = discord.message as Message;
  const packageFile = JSON.parse((await readFile("./package.json")).toString());
  const readmeFile = (await readFile("./README.md")).toString();
  const helpEmbed = new MessageEmbed()
    .setColor(0x00ff00)
    .setTitle(`Hold'em Bot v${packageFile.version}`)
    .setURL(packageFile.homepage)
    .setDescription(readmeFile.split("\n").map(line => line.trimEnd()).join("\n"))
    .setThumbnail(discordClient.user!.avatarURL({ format: "png" })!)
    .attachFiles(["./images/chevtek.png"])
    .setFooter("Created by Chevtek", "attachment://chevtek.png");
    await message.reply(helpEmbed);
}