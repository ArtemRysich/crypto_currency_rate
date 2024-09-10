const ERROR_MESSAGES = {
  listAlreadeCreated: (symbolA: string, symbolB: string) =>
    `Sorry, but the ${symbolA.toUpperCase()} and ${symbolB.toUpperCase()} pair already created`,
  pairUnavailable: (symbolA: string, symbolB: string) =>
    `Sorry, but the ${symbolA.toUpperCase()} and ${symbolB.toUpperCase()} pair is temporarily unavailable`,
  pairNotFound: (pair: string) => `Pair ${pair.toUpperCase()} not found`,
  emtyDataForTimeStamp: () =>
    'The specified time period is invalid. Value fromTimestamp must be less than toTimestamp',
};

export { ERROR_MESSAGES };
