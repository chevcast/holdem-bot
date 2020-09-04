import {
  Message,
  MessageReaction,
} from "discord.js";
import Yargs from "yargs/yargs";
import formatMoney from "./format-money";
import { BettingRound } from "@chevtek/poker-engine";
import { ChannelTable, ActionEmoji } from "../models";

export default async function (table: ChannelTable) {

  await table.render();

  // If there is an existing prompt for this channel then create a new prompt and resolve the old one with it.
  if (table.prompt) return table.createPrompt(table.prompt);

  (async function () {
    let lastAction;
    while (table.currentRound) {
      const player = table.currentActor!;
      try {
        const legalActions = player.legalActions();
        if (legalActions.includes("bet") || legalActions.includes("raise")) {
          legalActions.push("all-in");
        }
        const actionsTxt = legalActions.map((action, index) => {
          if (["bet", "raise"].includes(action)) {
            action += " <number>";
          }
          if (index === legalActions.length - 1){ 
            return ` or \`${action}\``
          }
          return ` \`${action}\``;
        }).join();
        // Ask user what they would like to do.
        const currentBetTxt = table.currentBet && table.currentBet > 0 ? `The current bet is \`${formatMoney(table.currentBet)}\`.` : "There is no bet yet.";
        const reactions: ActionEmoji[] = [];
        if (legalActions.includes("check") || legalActions.includes("call")) {
          reactions.push(ActionEmoji.CHECK_OR_CALL);
        }
        if (legalActions.includes("bet") || legalActions.includes("raise")) {
          reactions.push(ActionEmoji.BET_OR_RAISE);
        }
        if (legalActions.includes("fold")) {
          reactions.push(ActionEmoji.FOLD);
        }
        const prompt = await table.createPrompt({
          userId: player.id,
          text: `<@${player.id}>,${lastAction ? ` ${lastAction}` : ""} ${currentBetTxt} What would you like to do?\n You can type: ${actionsTxt}. You can also use the emoji reacts below this message.`,
          reactions,
          awaitMessages: {
            filter: response => response && legalActions.includes(response.content.toLowerCase().split(" ")[0]) && response.author.id === player.id,
            options: { max: 1 }
          },
          awaitReactions: {
            filter: (reaction, user) => reaction
              && [
                ActionEmoji.CHECK_OR_CALL,
                ActionEmoji.BET_OR_RAISE,
                ActionEmoji.FOLD
              ].includes(reaction.emoji.id)
              && user.id === player.id,
            options: { max: 1 }
          }
        });

        const collected = await prompt.promise!;

        const response = collected.first()!;
        let action: string;
        if (!response) continue;
        switch ((<MessageReaction>response)?.emoji?.id) {
          case ActionEmoji.CHECK_OR_CALL:
            if (legalActions.includes("check")) {
              action = "check";
            } else if (legalActions.includes("call")) {
              action = "call";
            }
            break;
          case ActionEmoji.BET_OR_RAISE:
            const prompt = await table.createPrompt({
              userId: player.id,
              text: `<@${player.id}>, how much would you like to bet? \`<number|"all-in">\``,
              reactions: [ActionEmoji.ALL_IN],
              awaitMessages: {
                filter: response => response && response.content !== "" && ((!isNaN(response.content.replace("$", "")) || response.content.toLowerCase() === "all-in")),
                options: { max: 1 }
              },
              awaitReactions: {
                filter: (reaction, user) => reaction && reaction.emoji.id === ActionEmoji.ALL_IN
                  && user.id === player.id,
                options: { max: 1 }
              }
            });

            const collected = await prompt.promise!;

            const betResponse = collected.first()!;
            if (!betResponse) continue;
            switch ((<MessageReaction>betResponse).emoji?.id) {
              case ActionEmoji.ALL_IN:
                action = legalActions.includes("raise") ? `raise ${player.stackSize}` : `bet ${player.stackSize}`;
                break;
              case undefined:
                const amount = (<Message>betResponse).content.toLowerCase().replace("$", "");
                if (!amount) return;
                if (amount === "all-in") {
                  action = legalActions.includes("raise") ? `raise ${player.stackSize}` : `bet ${player.stackSize}`;
                } else {
                  action = legalActions.includes("raise") ? `raise ${amount}` : `bet ${amount}`;
                }
                break;
            }
            break;
          case ActionEmoji.FOLD:
            action = "fold";
            break;
          case undefined:
            action = (<Message>response).content.toLowerCase();
            if (action === "all-in") action = `raise ${player.stackSize}`;
            break;
          default:
            throw new Error(`<@${player.id}>, unrecognized action.`);
        }

        const roundBeforeAction = table.currentRound;
        const playerName = table.channel.guild!.members.cache.get(player.id)!.displayName;

        await new Promise((resolve, reject) => Yargs()
          .exitProcess(false)
          .command(
            "bet <amount>",
            "Open the bet.",
            yargs => yargs.number("amount").required("amount"),
            async ({ amount }) => {
              player.betAction(amount);
              lastAction = `${playerName} bet \`$${amount}\`.`;
              await table.playRandomSound("./sounds/bet-raise");
            }
          )
          .command(
            "call",
            "Call the current bet.",
            () => {},
            async () => {
              player.callAction();
              lastAction = `${playerName} called.`;
              await table.playRandomSound("./sounds/call");
            }
          )
          .command(
            "check",
            "Pass action forward if there is no bet.",
            () => {},
            async () => {
              player.checkAction();
              lastAction = `${playerName} checked.`;
              await table.playRandomSound("./sounds/check");
            }
          )
          .command(
            "raise <amount>",
            "Raise the current bet.",
            yargs => yargs.number("amount").required("amount"),
            async ({ amount }) => {
              player.raiseAction(amount);
              lastAction = `${playerName} raised to \`$${amount}\`.`;
              await table.playRandomSound("./sounds/bet-raise");
            }
          )
          .command(
            "fold",
            "Leave the hand.",
            () => {},
            async () => {
              player.foldAction();
              lastAction = `${playerName} folded.`;
              await table.playRandomSound("./sounds/fold");
            }
          )
          .onFinishCommand(resolve)
          .fail((msg, err) => reject(msg || err))
          .parse(action!)
        );

        const roundAfterAction = table.currentRound;
        if (roundAfterAction !== roundBeforeAction) {
          lastAction = `Betting for the ${roundAfterAction} has begun.`;
        }

        // Play post-round sound effects.
        if (table.voiceConnection && roundAfterAction !== roundBeforeAction) {
          await new Promise((resolve) => setTimeout(resolve, 500));
          (async () => {
            await table.playRandomSound("./sounds/gather-chips");
            await new Promise((resolve) => setTimeout(resolve, 500));
            switch (roundAfterAction) {
              case BettingRound.FLOP:
                for (let index = 0; index < 3; index++) {
                  await table.playRandomSound("./sounds/place-card");
                }
                break;
              case BettingRound.TURN:
                await table.playRandomSound("./sounds/place-card");
                break;
              case BettingRound.RIVER:
                await table.playRandomSound("./sounds/place-card");
                break;
              default:
                await table.playRandomSound("./sounds/winner");
                break;
            }
          })();
        }

        // Re-render table and delete any active prompt.
        delete table.prompt;
        await table.render();
        if (table.winners) table.cleanUp();
        await table.saveToDb();

      } catch (err) {
        await table.render();
        const user = table.channel.guild.members.cache.get(player.id)!.user;
        const channel = user.dmChannel || await user.createDM();
        channel.send(`<@${player.id}>, ${err.message || err}`);
      }
    }
  })();
}