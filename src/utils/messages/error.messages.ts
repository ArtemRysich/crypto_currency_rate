const ERROR_MESSAGES = {
  listAlreadeCreated: (symbolA: string, symbolB: string) =>
    `Sorry, but the ${symbolA} and ${symbolB} pair already created`,
  pairUnavailable: (symbolA: string, symbolB: string) =>
    `Sorry, but the ${symbolA} and ${symbolB} pair is temporarily unavailable`,
  pairNotFound: (pair: string) => `Pair ${pair} not found`,
  emtyDataForTimeStamp: () =>
    'The specified time period is invalid. Value fromTimestamp must be less than toTimestamp',
  noRecords: () => 'Unfortunately, there are no records for this time period',
};

export { ERROR_MESSAGES };
