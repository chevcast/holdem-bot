import db from "../db";

export class Account {

  constructor(
    public id: string,
    public guildId: string,
    public bankroll: number,
  ) { }

  saveToDb() {
    const { accounts } = db;
    if (!accounts) throw new Error("Unable to save account. No database container.");
    const doc = {
      id: this.id,
      guildId: this.guildId,
      bankroll: this.bankroll
    };
    return accounts.items.upsert(doc);
  }

  deleteFromDb() {
    const { accounts } = db;
    if (!accounts) throw new Error("Unable to delete account. No database container.");
    return accounts.item(this.id).delete();
  }

  static async findById(playerId: string) {
    const { accounts } = db;
    if (!accounts) throw new Error("Unable to find account. No database container.");
    const { resources: docs } = await accounts.items.query({
      query: "SELECT * FROM c WHERE c.playerId=@playerId",
      parameters: [
        { name: "@playerId", value: playerId }
      ]
    }).fetchAll();
    if (!docs || docs.length === 0) return;
    return docs.map(doc => new Account(doc.id, doc.guildId, doc.bankroll));
  }

  static async findByIdAndGuild(playerId: string, guildId: string) {
    const { accounts } = db;
    if (!accounts) throw new Error("Unable to find account. No database container.");
    const { resources: [doc] } = await accounts.items.query({
      query: "SELECT * FROM c WHERE c.playerId=@playerId AND c.guildId=@guildId",
      parameters: [
        { name: "@playerId", value: playerId},
        { name: "@guildId", value: guildId }
      ]
    }).fetchAll();
    if (!doc) return;
    return new Account(playerId, doc.guildId, doc.bankroll);
  }

}