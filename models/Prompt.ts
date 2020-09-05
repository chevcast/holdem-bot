import { 
  CollectorFilter,
  AwaitReactionsOptions,
  AwaitMessagesOptions,
} from "discord.js";

export enum ActionEmoji {
  CHECK_OR_CALL = "749318088230699018",
  BET_OR_RAISE = "749318023755857932",
  FOLD = "749318088272642228",
  ALL_IN = "750432704230588457",
  YES = "749412605218652381",
  NO = "749412605168189450"
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