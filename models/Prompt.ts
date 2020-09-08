import { 
  CollectorFilter,
  AwaitReactionsOptions,
  AwaitMessagesOptions,
} from "discord.js";

export enum ActionEmoji {
  CHECK_OR_CALL = "752658604422594569",
  BET_OR_RAISE = "752658604053495841",
  FOLD = "752658604406079528",
  ALL_IN = "752658604170936441"
}

export interface Prompt { 
  userId: string,
  text: string,
  reactions?: ActionEmoji[],
  awaitReactions?: {
    filter: CollectorFilter,
    options: AwaitReactionsOptions
  },
  awaitMessages?: {
    filter: CollectorFilter,
    options: AwaitMessagesOptions
  },
  remainingTime?: number,
  timerIntervalId?: NodeJS.Timeout,
  promise?: Promise<string | undefined>,
  resolve?: (value?: string | PromiseLike<string | undefined> | undefined) => void,
  reject?: (reason?: any) => void
}