import Web3, { Contract } from 'web3';
import { Model } from 'mongoose';
import { Cache } from 'cache-manager';
import { firstValueFrom } from 'rxjs';
import { InjectModel } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';
import { Inject, Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { pairAbi } from './utils/pairAbi';
import { CurrencyPair } from './schemas/currency-pairs.schema';
import { WhitelistService } from './whitelist/whitelist.service';
import { IcurrencyPair } from './interfaces/currencypair.interface';
import { CreateContractDto } from './whitelist/dto/createContract.dto';
import { Reserves } from './interfaces/reserves.interface';
import { ETHER, MAXIMUM_PERCENTAGE_DIFFERENCE } from './common/constants';
import { IsmartContract } from './interfaces/smartContract.interface';
import { IrateResponse } from './interfaces/rate.interface';

@Injectable()
export class AppService {
  private readonly web3: Web3;
  constructor(
    @InjectModel(CurrencyPair.name)
    private readonly currencyPiarModel: Model<CurrencyPair>,
    private readonly whiteListService: WhitelistService,
    private readonly configService: ConfigService,
    @Inject('CACHE_MANAGER') private cacheManager: Cache,
  ) {
    this.web3 = new Web3(
      new Web3.providers.HttpProvider('https://bsc-dataseed.binance.org/'),
    );
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async compareExchangeRates(): Promise<void> {
    const whiteList = await this.whiteListService.getAllContratcs();

    if (!whiteList.length) {
      return;
    }

    whiteList.forEach(
      async ({ symbolA, symbolB, binancePair, pairAddressUni }) => {
        const previousResult: IcurrencyPair =
          await this.cacheManager.get(binancePair);
        let isInvalidPair: boolean = false;

        if (previousResult && !previousResult.isCorrect) {
          isInvalidPair = true;
        }

        const rate = await this.createRate(
          symbolA,
          symbolB,
          binancePair,
          pairAddressUni,
          isInvalidPair,
        );

        if (rate) {
          await this.cacheManager.set(binancePair, rate, 6000);
        }
      },
    );
  }

  async getRate(
    symbolA: string,
    symbolB: string,
  ): Promise<IrateResponse | undefined> {
    const pair = `${symbolA}${symbolB}`.toUpperCase();
    const cache: IcurrencyPair = await this.cacheManager.get(pair);

    if (!cache) {
      const whiteList = await this.whiteListService.getAllContratcs();
      let smartContract: IsmartContract;

      if (whiteList && whiteList.length) {
        smartContract = whiteList.find(
          ({ binancePair }) => binancePair === pair,
        );
      }

      if (!smartContract) {
        const dto: CreateContractDto = { symbolA, symbolB };
        smartContract = await this.whiteListService.create(dto);

        if (!smartContract) {
          return;
        }
      }

      const rate = await this.createRate(
        symbolA,
        symbolB,
        smartContract.binancePair,
        smartContract.pairAddressUni,
        false,
      );

      if (!rate) {
        return;
      }

      await this.cacheManager.set(pair, rate, 6000);
      return this.getRate(symbolA, symbolB);
    }

    if (!cache.isCorrect) {
      return;
    }

    return {
      rate: cache.rate,
      timestamp: cache.timeStamp,
    };
  }


  async getHistory(
    symbolA: string,
    symbolB: string,
    fromTimestamp: number,
    toTimestamp: number,
  ): Promise<IrateResponse[]> {
    const pair: string = `${symbolA}${symbolB}`.toUpperCase();
    const history = await this.currencyPiarModel
      .find({
        binancePair: pair,
        timeStamp: {
          $gte: fromTimestamp,
          $lte: toTimestamp,
        },
        isCorrect: { $ne: false },
      })
      .exec();

    return history.map(({ timeStamp, rate }) => ({
      timestamp: timeStamp,
      rate,
    }));
  }

  private async createRate(
    symbolA: string,
    symbolB: string,
    binancePair: string,
    pancakePair: string,
    isInvalidRates: boolean = false,
  ): Promise<IcurrencyPair | undefined> {
    const binancePairData = await firstValueFrom(
      this.whiteListService.getBinancePair(binancePair),
    );

    if (!binancePairData && !binancePairData.rate) {
      return;
    }

    const pancakePairRate: string = await this.getPancakePairRate(pancakePair);

    if (!pancakePairRate) {
      return;
    }

    const percentDiscrepancy: number = this.getPercentDiscrepancy(
      binancePairData.price,
      pancakePairRate,
    );

    const rate = {
      symbolA,
      symbolB,
      binancePair: binancePair,
      pairAddressUni: pancakePair,
      timeStamp: Date.now(),
      rate: binancePairData.price,
      isCorrect:
        !isInvalidRates && percentDiscrepancy < MAXIMUM_PERCENTAGE_DIFFERENCE
          ? true
          : false,
    };

    const createdPair = new this.currencyPiarModel(rate);

    return createdPair.save();
  }

  private async getPancakePairRate(pancakePair: string): Promise<string> {
    const pairContract = new this.web3.eth.Contract(pairAbi, pancakePair);
    const reserves: Reserves = await pairContract.methods.getReserves().call();
    const reserveA: string = this.web3.utils.fromWei(
      reserves._reserve0.toString(),
      ETHER,
    );
    const reserveB: string = this.web3.utils.fromWei(
      reserves._reserve1.toString(),
      ETHER,
    );

    const price: number = Number(reserveB) / Number(reserveA);

    const formattedPrice: string = price.toFixed(8);

    return formattedPrice;
  }

  private getPercentDiscrepancy(
    binancePair: string,
    pancakePairRate: string,
  ): number {
    const binancePrice: number = Number(binancePair);
    const pancakePrice: number = Number(pancakePairRate);
    const percentDiscrepancy: number =
      (Math.abs(binancePrice - pancakePrice) / binancePrice) * 100;

    return percentDiscrepancy;
  }
}
