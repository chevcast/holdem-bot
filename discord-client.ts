import { Client as DiscordClient } from "discord.js";
import config from "./config";

const { DISCORD_BOT_TOKEN } = config;

const client = new DiscordClient();

client.login(DISCORD_BOT_TOKEN);

export default client;
