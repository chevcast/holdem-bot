import { MessageEmbed, Message } from "discord.js";

import fs from "fs";
import util from "util";
import config from "../config";
import discordClient from "../discord-client";
import { help } from "yargs";

const readFile = util.promisify(fs.readFile);

const { COMMAND_PREFIX } = config;

export const command = ["help", "h"];

export const description = "Show all available commands.";

export async function handler ({ discord }) {
  const message = discord.message as Message;
  const packageFile = JSON.parse((await readFile("./package.json")).toString());
  const helpEmbed = new MessageEmbed()
    .setColor(0x00ff00)
    .setTitle(`Hold'em Bot v${packageFile.version}`)
    .setURL(packageFile.homepage)
    .setDescription(
      `
        Welcome to Hold'em Bot!

        Check out the commands below to begin!
        If you have any issues please submit them [here](${packageFile.bugs.url}).

        ---------------

        **${COMMAND_PREFIX}create** (Channel Only)
        Create a Hold'em table in the current channel.

        **--min-buy-in <number>**
        Specify a minimum buy-in amount for the table.
        **--no-sound**
        Disable sound effects for this table.
        **--small-blind <number>**
        Specify the amount of the small blind.
        **--big-blind <number>**
        Specify the amount of the big blind.
        **--buy-in <number>**
        Specify the amount you, as the creator, intend to bring to the table.
        **--reset**
        Create a new table and override any existing table.

        ---------------

        **${COMMAND_PREFIX}deal** (DM or Channel)
        Deal the cards and begin the hand!

        The table creator or the player in the dealer position can run this command. 
        
        Once a hand has begun all seated players will receive a private message from Hold'em Bot. This message is where the entire hand and betting will take place. This way you can see your hole cards and don't have to flip back and forth between the private message and the channel :)

        ---------------

        **${COMMAND_PREFIX}sit [seat] [buy-in]** (Channel Only)
        Take a seat at the active Hold'em table.

        **--seat <number>**
        Specify which seat you'd like to take at the table.
        **--buy-in <number>**
        Specify the amount of money to bring to the table. Defaults to the minimum buy-in for the table.

        ---------------

        **${COMMAND_PREFIX}stand** (DM or Channel)
        Stand up from your current table.

        ---------------

        **${COMMAND_PREFIX}refresh** (DM or Channel)
        Refresh the current table. Useful if the table has been scrolled out of view by chatter.

        ---------------

        **${COMMAND_PREFIX}destroy** (DM or Channel)
        Destroy the current table. This command can only be issued by the table creator.

      `.split("\n").map(line => line.trim()).join("\n")
    )
    .setThumbnail(discordClient.user!.avatarURL({ format: "png" })!)
    .attachFiles(["./images/chevtek.png"])
    .setFooter("Created by Chevtek", "attachment://chevtek.png");
    await message.reply(helpEmbed);
}