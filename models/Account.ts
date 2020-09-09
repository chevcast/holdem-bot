import db from "../db";

export class Account {

  public id: string;

  constructor(
    public playerId: string,
    public guildId: string,
    public bankroll: number,
  ) {
    this.id = playerId + guildId;
  }

  saveToDb() {
    const { accounts } = db;
    if (!accounts) throw new Error("Unable to save account. No database container.");
    const doc = {
      id: this.id,
      playerId: this.playerId,
      guildId: this.guildId,
      bankroll: this.bankroll,
      _partitionKey: "/_partitionKey"
    };
    return accounts.items.upsert(doc);
  }

  deleteFromDb() {
    const { accounts } = db;
    if (!accounts) throw new Error("Unable to delete account. No database container.");
    return accounts.item(this.id, "/_partitionKey").delete();
  }

  static async findByPlayerId(playerId: string) {
    const { accounts } = db;
    if (!accounts) throw new Error("Unable to find account. No database container.");
    const { resources: docs } = await accounts.items.query({
      query: "SELECT * FROM c WHERE c.playerId=@playerId",
      parameters: [
        { name: "@playerId", value: playerId }
      ]
    }, { partitionKey: "/_partitionKey" }).fetchAll();
    if (!docs || docs.length === 0) return;
    return docs.map(doc => new Account(doc.id, doc.guildId, doc.bankroll));
  }

  static async findByPlayerAndGuild(playerId: string, guildId: string) {
    const { accounts } = db;
    if (!accounts) throw new Error("Unable to find account. No database container.");
    const { resource: doc } = await accounts.item(playerId + guildId, "/_partitionKey").read();
    if (!doc) return;
    return new Account(playerId, doc.guildId, doc.bankroll);
  }

}