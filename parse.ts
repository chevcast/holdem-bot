import Yargs from "yargs/yargs";
import { MessageEmbed } from "discord.js";
import config from "./config";

const { COMMAND_PREFIX } = config;

const onFail = (err, channel) => {
  const errorEmbed = new MessageEmbed()
    .attachFiles(["./images/error-chip.png", "./images/chevtek.png"])
    .setTitle("Something went wrong...")
    .setColor(0xff0000)
    .setDescription(`\`\`\`${err?.stack ?? err.toString()}\`\`\``)
    .setThumbnail("attachment://error-chip.png")
    .setFooter("Created by Chevtek", "attachment://chevtek.png");
  channel.send(errorEmbed);
};

export default (cmdInput, context) => {
  const { channel } = context.discord.message;

  const yargs = Yargs();

  yargs
    .commandDir("commands", {
      extensions: ["js", "ts"]
    })
    .exitProcess(false)
    .fail((msg, err, yargs) => {
      if (!err) return;
      onFail(err, channel);
    })
    .help(false)
    .parserConfiguration({
      "strip-aliased": true,
      "strip-dashed": true,
      "sort-commands": true
    })
    .scriptName("")
    .showHelpOnFail(false)
    .usage(`<${COMMAND_PREFIX}command> [options]`)
    .version(false)
    .wrap(60);

  try {
    yargs.parse(cmdInput, context, (err, argv: any, output) => {
      if (err) return onFail(err, channel);
      const { help } = argv;
      if (output) {
        if (help) {
          const cmdName = argv._[0]?.charAt(0).toUpperCase().concat(argv._[0]?.slice(1));
          const helpEmbed = new MessageEmbed({
            title: `${ cmdName ?? "Chevbot"} Help`,
            color: "#FDE15B",
            description: `\`\`\`${output}\`\`\``
          });
          channel.send(helpEmbed);
          return;
        }
        channel.send(output);
      }
    });
  } catch (err) {
    onFail(err, channel);
  }
}
