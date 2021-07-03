import db from "../db";

export class Account {

  constructor(
    public playerId: string,
    public guildId: string,
    public bankroll: number,
    public name?: string
  ) { }

  async saveToDb() {
    const { AccountModel } = db;
    const { playerId, guildId, bankroll, name } = this;
    if (!AccountModel) throw new Error("Unable to save account. No database container.");
    const doc = { playerId, guildId, bankroll, name };
    const existingAccount = await Account.findByPlayerAndGuild(this.playerId, this.guildId);
    if (existingAccount) {
      return AccountModel.updateOne({ playerId, guildId }, doc);
    } else {
      return AccountModel.create(doc);
    }
  }

  deleteFromDb() {
    const { playerId, guildId } = this;
    const { AccountModel } = db;
    if (!AccountModel) throw new Error("Unable to delete account. No database container.");
    return AccountModel.findOneAndDelete({ playerId, guildId });
  }
  
  static async findByGuildId(guildId: string) {
    const { AccountModel } = db;
    if(!AccountModel) throw new Error("Unable to find account. No database container.");
    const accounts = await AccountModel.find({ guildId });
    if (!accounts || accounts.length === 0) return;
    return accounts.map(account => new Account(
      account.playerId,
      account.guildId,
      account.bankroll,
      account.name
    ));
  }

  static async findByPlayerId(playerId: string) {
    const { AccountModel } = db;
    if (!AccountModel) throw new Error("Unable to find account. No database container.");
    const accounts = await AccountModel.find({ playerId });
    if (!accounts || accounts.length === 0) return;
    return accounts.map(account => new Account(
      account.playerId,
      account.guildId,
      account.bankroll,
      account.name
    ));
  }

  static async findByPlayerAndGuild(playerId: string, guildId: string) {
    const { AccountModel } = db;
    if (!AccountModel) throw new Error("Unable to find account. No database container.");
    const accounts = await AccountModel.find({ playerId, guildId });
    if (!accounts || accounts.length === 0) return;
    const [{ bankroll, name }] = accounts;
    return new Account(playerId, guildId, bankroll, name);
  }

}