import fs from "fs";
import { createCanvas } from "canvas";
import { Message } from "discord.js";

export const command = "draw-cards";

export const description = false;

export async function handler ({ discord }) {
  const message = discord.message as Message;
  const canvas = createCanvas(32, 32);
  const ctx = canvas.getContext("2d");
  const cornerRadius = 7;
  const suits = [
    { name: "club", char: "♣", color: "#000000" },
    { name: "diamond", char: "♦", color: "#ff0000" },
    { name: "heart", char: "♥", color: "#ff0000" },
    { name: "spade", char: "♠", color: "#000000" }
  ];
  const ranks = ["2","3","4","5","6","7","8","9","10","J","Q","K","A"];

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  for (const suit of suits) {
    ctx.beginPath();
    ctx.moveTo(1,0);
    ctx.lineTo(1,31-cornerRadius);
    ctx.quadraticCurveTo(1,31,1+cornerRadius,31);
    ctx.lineTo(31-cornerRadius,31);
    ctx.quadraticCurveTo(31,31,31,31-cornerRadius);
    ctx.lineTo(31,0);
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.lineTo(1,0);
    ctx.closePath();
    ctx.fillStyle = "#ffffff";
    ctx.fill();
    ctx.font = "bold 20px Arial";
    ctx.fillStyle = suit.color;
    ctx.fillText(suit.char,16,16);
    await new Promise((resolve) => canvas.createPNGStream()
      .pipe(fs.createWriteStream(`./images/cards/${suit.name}.png`))
      .on("finish", resolve)
    );
  };
  for (const color of ["red","black"]) {
    ctx.clearRect(0,0,32,32);
    for (const rank of ranks) {
      ctx.beginPath();
      ctx.moveTo(1,32);
      ctx.lineTo(1,1+cornerRadius);
      ctx.quadraticCurveTo(1,1,1+cornerRadius,1);
      ctx.lineTo(31-cornerRadius,1);
      ctx.quadraticCurveTo(31,1,31,1+cornerRadius);
      ctx.lineTo(31,32);
      ctx.strokeStyle = "#000000";
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.lineTo(1,32);
      ctx.closePath();
      ctx.fillStyle = "#ffffff";
      ctx.fill();
      ctx.font = "bold 20px Arial";
      ctx.fillStyle = color;
      ctx.fillText(rank,16,16);
      await new Promise((resolve) => canvas.createPNGStream()
        .pipe(fs.createWriteStream(`./images/cards/${rank}_${color}.png`))
        .on("finish", resolve)
      );
    };
  }
  await message.reply("...done.");
}