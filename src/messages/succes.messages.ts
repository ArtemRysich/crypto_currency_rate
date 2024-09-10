const SUCCES_MESSAGES = {
  listEmty: () => `Your whitelist is empty`,
  pairRemoved: (pair: string) =>
    `Pair ${pair.toUpperCase()} successfully removed`,
  noRecords: () => 'Unfortunately, there are no records for this time period',
};

export { SUCCES_MESSAGES };
