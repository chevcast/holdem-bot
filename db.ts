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
  pokerTables?: Container
}

let containers: containers = {};

export async function initializeDb () {
  const { database } = await client.databases.createIfNotExists({ id: COSMOS_DATABASE_ID });
  const { container } = await database.containers.createIfNotExists(
    { id: "poker-tables" },
    { offerThroughput: 400 }
  );
  container.getPartitionKeyDefinition().then(console.log);
  containers.pokerTables = container;
}

export default containers;
