import { SkipThrottle } from '@nestjs/throttler';
import { Controller, Get, Query } from '@nestjs/common';
import { UppercasePipe } from 'src/utils/pipes/uppercase.pipe';
import { ExchangeRatesService } from './exchange_rates.service';

@Controller('exchange-rates')
export class ExchangeRatesController {
  constructor(private readonly exchangeRatesService: ExchangeRatesService) {}

  @SkipThrottle({ default: true })
  @Get('getRate')
  async getRate(
    @Query('symbolA', UppercasePipe) symbolA: string,
    @Query('symbolB', UppercasePipe) symbolB: string,
  ) {
    return await this.exchangeRatesService.getRate(symbolA, symbolB);
  }

  @Get('getHistoryRates')
  async getHistoryRates(
    @Query('symbolA', UppercasePipe) symbolA: string,
    @Query('symbolB', UppercasePipe) symbolB: string,
    @Query('fromTimestamp') fromTimestamp: number,
    @Query('toTimestamp') toTimestamp: number,
  ) {
    return await this.exchangeRatesService.getHistory(
      symbolA,
      symbolB,
      fromTimestamp,
      toTimestamp,
    );
  }
}
