import { MessageEmbed, Message } from "discord.js";

import fs from "fs";
import util from "util";
import discordClient from "../discord-client";

const readFile = util.promisify(fs.readFile);

export const command = ["help [command]", "h"];

export const description = "Show all available commands.";

export const builder = yargs => yargs.positional("command", {
  description: "The command to get help details for.",
  type: "string"
})

export async function handler ({ discord, command }) {
  const message = discord.message as Message;
  const packageFile = JSON.parse((await readFile("./package.json")).toString());
  const docFile = (await readFile(`./COMMAND_DOCS/${command?.toUpperCase() ?? "INDEX"}.md`)).toString();
  const helpEmbed = new MessageEmbed()
    .setColor("#FDE15B")
    .setTitle(command ? `${command.toUpperCase()}` : `Hold'em Bot v${packageFile.version}`)
    .setDescription(docFile.split("\n").map(line => line.trimEnd()).join("\n"))
    .setThumbnail(discordClient.user!.avatarURL({ format: "png" })!)
    .attachFiles(["./images/chevtek.png"])
    .setFooter("Created by Chevtek", "attachment://chevtek.png");
    if (!command) {
      helpEmbed.setURL(packageFile.homepage)
    }
  await message.reply(helpEmbed);
}