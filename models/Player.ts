import db from "../db";

const playerCache: { [key: string]: Player } = {};

export class Player {

  constructor(
    public id: string,
    public guildId: string,
    public stackSize: number,
  ) { }

  saveToDb() {
    const { players } = db;
    if (!players) throw new Error("Unable to save player. No database container.");
    playerCache[this.id] = this;
    const doc = {
      id: this.id,
      guildId: this.guildId,
      stackSize: this.stackSize
    };
    return players.items.upsert(doc);
  }

  deleteFromDb() {
    const { players } = db;
    if (!players) throw new Error("Unable to delete player. No database container.");
    if (playerCache[this.id]) {
      delete playerCache[this.id];
    }
    return players.item(this.id).delete();
  }

  static async findById(id: string) {
    const { players } = db;
    if (!players) throw new Error("Unable to find player. No database container.");
    if (playerCache[id]) {
      return playerCache[id];
    }
    const { resource: doc } = await players.item(id).read();
    if (!doc) return;
    const player = new Player(id, doc.guildId, doc.stackSize);
    if (!playerCache[id]) {
      playerCache[id] = player;
    }
    return player;
  }

}