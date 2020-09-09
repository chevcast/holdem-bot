import { createCanvas, registerFont, loadImage } from "canvas";
import { calcShapePoints, roundRect } from ".";
import { formatMoney } from "../utilities";
import { CardSuit, Card, BettingRound, CardRank } from "@chevtek/poker-engine";
import { Table } from "../models";
import config from "../config";

const { COMMAND_PREFIX } = config;

const suitChar = (suit: CardSuit) => {
  switch (suit) {
    case CardSuit.CLUB:
      return "♣";
    case CardSuit.DIAMOND:
      return "♦";
    case CardSuit.HEART:
      return "♥";
    case CardSuit.SPADE:
      return "♠";
  }
};

export default async function (table: Table): Promise<Buffer> {

  registerFont("./fonts/arial.ttf", { family: "sans-serif" });
  registerFont("./fonts/arialbd.ttf", { family: "sans-serif" });

  const width = 600, height = 600;
  const xCenter = width / 2, yCenter = height / 2;
  const tableRadius = 230, tableEdgeWidth = 35;
  const numberOfSeats = 10;
  const cardWidth = 50, cardHeight = 75, cardSpacing = 3;
  const tableOffset = 1.5;
  const tableCorners = calcShapePoints(xCenter, yCenter, tableRadius, tableOffset, numberOfSeats);
  const seatLocations = calcShapePoints(xCenter, yCenter, tableRadius + 10, tableOffset + 0.5, numberOfSeats);
  const buttonLocations = calcShapePoints(xCenter, yCenter, tableRadius - 65, tableOffset + 0.75, numberOfSeats);
  const betLocations = calcShapePoints(xCenter, yCenter, tableRadius - 65, tableOffset + 0.25, numberOfSeats);
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  const drawCard = (x: number, y: number, card: Card) => {
    const cornerRadius = 10;
    roundRect(x, y, cardWidth, cardHeight, cornerRadius, ctx);
    ctx.fillStyle = "#ffffff";
    ctx.fill();
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.font = "bold 35px Arial";
    ctx.fillStyle = card.color;
    ctx.fillText(card.rank === CardRank.TEN ? "10" : card.rank, x + (cardWidth/2), y + (cardHeight/3.5));
    ctx.font = "bold 45px Arial";
    ctx.fillStyle = card.color;
    ctx.fillText(card.suitChar, x + (cardWidth/2), y + (cardHeight - (cardHeight/3.5)));
  };

  const drawBackground = async () => {
    const carpet = await loadImage(`./images/casino-carpet.jpg`);
    ctx.drawImage(carpet, 0, 0, width, height);
    ctx.fillStyle = "rgba(0,0,0,0.8)";
    ctx.fillRect(0, 0, width, height);
  };

  const drawTable = async () => {
    ctx.beginPath();
    let [x, y] = tableCorners[0];
    ctx.moveTo (x, y);          
    for (let index = 1; index < numberOfSeats; index++) {
      [x, y] = tableCorners[index];
      ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fillStyle = "#065D21";
    ctx.fill();
    for (let index = 0; index < tableEdgeWidth; index++) {
      const redMin = 64, redMax = 189;
      const red = Math.floor((((redMax - redMin) / tableEdgeWidth) * index) + redMin);
      const greenMin = 45, greenMax = 126;
      const green = Math.floor((((greenMax - greenMin) / tableEdgeWidth) * index) + greenMin);
      const blueMin = 38, blueMax = 74;
      const blue = Math.floor((((blueMax - blueMin) / tableEdgeWidth) * index) + blueMin);
      ctx.strokeStyle = `rgba(${red},${green},${blue}, 1)`;
      // const color = Math.floor((50 / tableEdgeWidth) * index);
      // ctx.strokeStyle = `rgba(${color},${color},${color}, 1)`;
      ctx.lineWidth = tableEdgeWidth - index;
      ctx.stroke();
    }
    ctx.fillStyle = "rgba(0,0,0,0.25)";
    ctx.font = "bold 500px Arial";
    ctx.fillText(suitChar(CardSuit.CLUB)!, xCenter, yCenter - 35);
  };

  const drawSeats = async () => {
    
    for (let index = 0; index < numberOfSeats; index++) {
      const player = table.players[index];
      const [x, y] = seatLocations[index];
      const radius = 50;

      if (player === null) {
        // Draw join message.
        const cornerRadius = 10;
        const joinMsgWidth = (radius*2);
        const joinMsgHeight = (radius);
        const joinMsgX = x - radius;
        const joinMsgY = y - (joinMsgHeight/2);
        roundRect(joinMsgX, joinMsgY, joinMsgWidth, joinMsgHeight, cornerRadius, ctx);
        ctx.fillStyle = "rgba(0,0,0,0.7)";
        ctx.fill();
        ctx.fillStyle = "rgba(255,255,255,0.5";
        ctx.font = "25px Arial";
        ctx.fillText(`${COMMAND_PREFIX}sit ${index + 1}`, x, y);
        continue;
      }

      const drawAvatar = async () => {
        const padding = 7;
        const avatarCanvas = createCanvas(radius * 2, radius * 2);
        const avatarCtx = avatarCanvas.getContext("2d");
        avatarCtx.beginPath();
        avatarCtx.arc(radius, radius, radius, 0, Math.PI * 2, true);
        avatarCtx.closePath();
        avatarCtx.clip();
        avatarCtx.fillStyle = "#000000"//"#292B2F";
        avatarCtx.fillRect(0, 0, radius * 2, radius * 2);
        const avatarUrl = table.channel.guild!.members.cache.get(player.id)!.user.displayAvatarURL({ format: "png"});
        const avatar = await loadImage(avatarUrl);
        avatarCtx.drawImage(avatar, 0, 0, radius * 2, radius * 2);
        avatarCtx.beginPath();
        avatarCtx.arc(radius, radius, radius - (padding/2), 0, Math.PI * 2, true);
        avatarCtx.closePath();
        if (player === table.currentActor || table.winners?.includes(player)) {
          for (let index = 0; index < padding; index++) {
            const color = Math.floor((255 / padding) * index);
            avatarCtx.strokeStyle = `rgb(0,${color},0, 1)`;
            avatarCtx.lineWidth = (padding - index) * 1.5;
            avatarCtx.stroke();
          }
        } else if (player.folded) {
          for (let index = 0; index < padding; index++) {
            const color = Math.floor((100 / padding) * index);
            avatarCtx.strokeStyle = `rgb(${color},${color},${color}, 1)`;
            avatarCtx.lineWidth = padding - index;
            avatarCtx.stroke();
          }
          avatarCtx.fillStyle = "rgba(0,0,0,0.85)";
          avatarCtx.fill();
        } else {
          for (let index = 0; index < padding; index++) {
            const color = Math.floor((255 / padding) * index);
            avatarCtx.strokeStyle = `rgb(${color},${color},${color}, 1)`;
            avatarCtx.lineWidth = padding - index;
            avatarCtx.stroke();
          }
          avatarCtx.fillStyle = "rgba(0,0,0,0.3)";
          avatarCtx.fill();
        }
        const avatarFinal = await loadImage(avatarCanvas.toBuffer(), `${player.id}.png`);
        ctx.drawImage(avatarFinal, x - radius, y - radius, radius * 2, radius * 2);
      };

      const drawNameplate = async () => {
        const cornerRadius = 10;
        const nameplateWidth = (radius*2);
        const nameplateHeight = radius - (radius/2);
        const nameplateX = x - radius;
        const nameplateY = y + (radius - (nameplateHeight/1.5));
        roundRect(nameplateX, nameplateY, nameplateWidth, nameplateHeight, cornerRadius, ctx);
        ctx.fillStyle = "rgba(0,0,0,0.7)";
        ctx.fill();
        if (player === table.currentActor || table.winners?.includes(player)) {
          ctx.fillStyle = "#00ff00";
        } else if (player.folded) {
          ctx.fillStyle = "#999999";
        } else {
          ctx.fillStyle = "#ffffff";
        }
        let text = table.channel.guild!.members.cache.get(player.id)!.displayName;
        const measureText = (text) => ctx.measureText(text).width < radius*2 - 3;
        let textFits = measureText(text);
        ctx.font = player === table.currentActor || table.winners?.includes(player) ? `bold 18px Arial` : `18px Arial`;
        if (!textFits && text.indexOf(" ") !== -1) {
          text = text.substr(0, text.indexOf(" "));
        }
        textFits = measureText(text);
        while (!textFits) {
          text = text.substr(0, text.length - 1);
          textFits = measureText(text);
        }
        ctx.fillText(text, nameplateX + radius, nameplateY + (nameplateHeight/2));
      };

      const drawBudget = async () => {
        const cornerRadius = 10;
        const budgetWidth = (radius*2);
        const budgetHeight = radius - (radius/2);
        const budgetX = x - radius;
        const budgetY = y - (radius + (budgetHeight/2.5));
        roundRect(budgetX, budgetY, budgetWidth, budgetHeight, cornerRadius, ctx);
        ctx.fillStyle = "rgba(0,0,0,0.7)";
        ctx.fill();
        if (player === table.currentActor || table.winners?.includes(player)) {
          ctx.fillStyle = "#ffff00";
        } else if (player.folded) {
          ctx.fillStyle = "#999955";
        } else {
          ctx.fillStyle = "#ffffbb";
        }
        const budgetTxt = player.stackSize ? formatMoney(player.stackSize) : "All In!";
        ctx.font = player === table.currentActor || table.winners?.includes(player) ? `bold 18px Arial` : `18px Arial`;
        ctx.fillText(budgetTxt, budgetX + radius, budgetY + (budgetHeight/2));
      };

      const drawHoleCards = async () => {
        const cardsX = x - (cardWidth + (cardSpacing/2));
        const cardsY = y - (cardHeight/2);
        const holeCards = player.holeCards;
        if (!holeCards) return;
        for (let index = 0; index < 2; index++) {
          drawCard(cardsX + (((cardWidth + cardSpacing) * index)), cardsY, holeCards[index]);
        }
        if (!table.winners?.includes(player) && player !== table.currentActor) {
          roundRect(cardsX, cardsY, (cardWidth * 2) + cardSpacing, cardHeight, 10, ctx);
          if (player.folded) {
            ctx.fillStyle = "rgba(0,0,0,0.85)";
          } else {
            ctx.fillStyle = "rgba(0,0,0,0.5)";
          }
          ctx.fill();
        }
      };

      const drawBusted = async () => {
        ctx.beginPath();
        ctx.moveTo(x - radius, y - radius);
        ctx.lineTo(x + radius, y + radius);
        ctx.moveTo(x + radius, y - radius);
        ctx.lineTo(x - radius, y + radius);
        ctx.strokeStyle = "#ff0000";
        ctx.lineWidth = 5;
        ctx.stroke();
      };

      await drawAvatar();
      await drawBudget();
      player.showCards && await drawHoleCards();
      await drawNameplate();
      (player.stackSize === 0 || player.left) && !table.currentRound && await drawBusted();
    }
  };

  const drawButtons = async () => {
    const buttonSize = 20;
    
    // Dealer Button
    const drawDealer = () => {
      if (table.dealerPosition === undefined) return;
      const [x, y] = buttonLocations[table.dealerPosition];
      ctx.beginPath();
      ctx.arc(x, y, buttonSize, 0, Math.PI * 2, true);
      ctx.closePath();
      ctx.fillStyle = "#ffffff";
      ctx.fill();
      ctx.strokeStyle = "#111111";
      ctx.lineWidth = 0.5;
      ctx.stroke();
      ctx.font = "bold 28px Arial";
      ctx.fillStyle = "#000000";
      ctx.fillText("D", x, y);
    };

    // Small Blind
    const drawSmallBlind = () => {
      if (table.smallBlindPosition === undefined || table.currentRound !== BettingRound.PRE_FLOP) return;
      const [x, y] = buttonLocations[table.smallBlindPosition];
      ctx.beginPath();
      ctx.arc(x, y, buttonSize, 0, Math.PI * 2, true);
      ctx.closePath();
      ctx.fillStyle = "#0000aa";
      ctx.fill();
      ctx.strokeStyle = "#111111";
      ctx.lineWidth = 0.5;
      ctx.stroke();
      ctx.font = "bold 20px Arial";
      ctx.fillStyle = "#ffffff";
      ctx.fillText("SB", x, y);
    };

    // Big Blind
    const drawBigBlind = () => {
      if (table.bigBlindPosition === undefined || table.currentRound !== BettingRound.PRE_FLOP) return;
      const [x, y] = buttonLocations[table.bigBlindPosition];
      ctx.beginPath();
      ctx.arc(x, y, buttonSize, 0, Math.PI * 2, true);
      ctx.closePath();
      ctx.fillStyle = "#ffff00";
      ctx.fill();
      ctx.strokeStyle = "#111111";
      ctx.lineWidth = 0.5;
      ctx.stroke();
      ctx.font = "bold 20px Arial";
      ctx.fillStyle = "#000000";
      ctx.fillText("BB", x, y);
    };

    if (table.dealerPosition !== undefined) {
      drawDealer();
    }
    if (table.currentRound === BettingRound.PRE_FLOP) {
      drawBigBlind();
      drawSmallBlind();
    }
  };

  const drawBets = async () => {
    for (let index = 0; index < table.players.length; index++) {
      const [x, y] = betLocations[index];
      const player = table.players[index];
      if (!player || player.bet === 0) continue;
      const bet = formatMoney(player.bet);
      ctx.font = "bold 25px Arial";

      if (player.stackSize === 0) {
        ctx.fillStyle = "#ff0000";
      } else if (player.raise && table.lastRaise === player.raise && table.currentBet === player.bet) {
        ctx.fillStyle = "rgb(247,99,0)";
      } /* else if (table.smallBlindPosition === index && table.currentRound === BettingRound.PRE_FLOP) {
        ctx.fillStyle = "#0000aa";
      } else if (table.bigBlindPosition === index && table.currentRound === BettingRound.PRE_FLOP) {
        ctx.fillStyle = "#ffff00";
      } */ else {
        ctx.fillStyle = "#ffffff";
      }
      ctx.fillText(bet, x, y);
    }
  };

  const drawCards = async () => {

    const drawCardPlaceholders = () => {
      const cornerRadius = 10;
      for (let index = 0; index < 5; index++) {
        const xStart = (xCenter - (cardSpacing * 2)) - (cardWidth * 2.5);
        const x = xStart + ((cardWidth + cardSpacing) * index);
        const y = yCenter - (cardHeight / 2);
        roundRect(x, y, cardWidth, cardHeight, cornerRadius, ctx);
        ctx.strokeStyle = "#ffff00";
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    };

    drawCardPlaceholders();
    for (let index = 0; index < table.communityCards.length; index++) {
      const xStart = (xCenter - (cardSpacing * 2)) - (cardWidth * 2.5);
      const x = xStart + ((cardWidth + cardSpacing) * index);
      const y = yCenter - (cardHeight / 2);
      const card = table.communityCards[index];
      drawCard(x, y, card);
    }

  };

  const drawCurrentPot = async () => {
    if (!table.currentRound && !table.winners) return;
    const cornerRadius = 10;
    const width = ((cardWidth * 5) + (cardSpacing * 4) - (cardWidth*1.5));
    const height = 50;
    const x = xCenter - (width/2);
    const y = yCenter + ((cardHeight/2) + (cardSpacing*2));
    roundRect(x, y, width, height, cornerRadius, ctx);
    ctx.fillStyle = "rgba(0,0,0,0.7)";
    ctx.fill();
    ctx.font = "bold 30px Arial";
    ctx.fillStyle = "#ffff00";
    ctx.fillText(formatMoney(table.currentPot.amount), xCenter, y + (height/2));
  };

  const drawWinner = async () => {
    const cornerRadius = 10;
    const width = ((cardWidth * 5) + (cardSpacing * 4));
    const height = 75;
    const x = xCenter - (width/2);
    const y = yCenter - (((cardHeight/2) + (cardSpacing*2)) + height);
    roundRect(x, y, width, height, cornerRadius, ctx);
    ctx.fillStyle = "rgba(0,0,0,0.7)";
    ctx.fill();
    ctx.font = "bold 30px Arial";
    ctx.fillStyle = "#00ff00";
    let line1, line2;
    if (table.winners!.length === 1) {
      const [winner] = table.winners!;
      const activePlayers = table.activePlayers;
      const winnerName = table.channel.guild!.members.cache.get(winner.id)!.displayName;
      line1 = `${winnerName} wins!`;
      line2 = activePlayers.length > 1 ? winner.hand.name : "Opponents Folded";
    } else {
      const [firstWinner] = table.winners!;
      line1 = `Draw!`;
      line2 = firstWinner.hand.name;
    }
    const measureText = (text) => ctx.measureText(text).width < width - 3;
    let textFits = measureText(line1);
    if (!textFits && line1.indexOf(" ") !== -1) {
      line1 = line1.substr(0, line1.indexOf(" "));
    }
    textFits = measureText(line1);
    while (!textFits) {
      line1 = line1.substr(0, line1.length - 1);
      textFits = measureText(line1);
    }
    ctx.fillText(line1, xCenter, y + (height/4));
    ctx.font = "30px Arial";
    ctx.fillText(line2, xCenter, y + (height - (height/4)));
  };

  await drawBackground();
  await drawTable();
  await drawButtons();
  await drawBets();
  await drawSeats().catch(console.log);
  await drawCards();
  await drawCurrentPot();
  table.winners && await drawWinner();

  return canvas.toBuffer();

}
