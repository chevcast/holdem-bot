import { CosmosClient, Container } from "@azure/cosmos";
import config from "./config";

const {
  COSMOS_DATABASE_ID,
  COSMOS_PRIMARY_KEY,
  COSMOS_URI
} = config;

const client = new CosmosClient({
  endpoint: COSMOS_URI,
  key: COSMOS_PRIMARY_KEY
});

interface containers {
  tables?: Container,
  accounts?: Container
}

let containers: containers = {};

export async function initializeDb() {
  const { database } = await client.databases.createIfNotExists({ id: COSMOS_DATABASE_ID });
  const { container: tables } = await database.containers.createIfNotExists(
    { id: "tables" },
    { offerThroughput: 400 }
  );
  containers.tables = tables;
  const { container: players } = await database.containers.createIfNotExists(
    { id: "accounts" },
    { offerThroughput: 400 }
  );
  containers.accounts = accounts;
}

export default containers;
