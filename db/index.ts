import mongoose from "mongoose";
import accountSchema from "./schema/Account";
import tableSchema from "./schema/Table"

import config from "../config";

const { MONGODB_CONNECTION_STRING } = config;

interface Models {
  AccountModel?: any,
  TableModel?: any
}

const models: Models = {};

export async function initializeDb () {
  mongoose.connection.on("error", console.log);
  mongoose.connection.once("open", () => {
    models.AccountModel = mongoose.model("Account", accountSchema);
    models.TableModel = mongoose.model("Table", tableSchema);
  });
  return mongoose.connect(MONGODB_CONNECTION_STRING, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
    useCreateIndex: true
  });
}

export default models;