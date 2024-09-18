import { Model } from 'mongoose';
import BigNumber from 'bignumber.js';
import { Cache } from 'cache-manager';
import { InjectModel } from '@nestjs/mongoose';
import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { BlockchainService } from './blockchain.service';
import { IrateResponse } from './interfaces/rate.interface';
import { CurrencyPair } from './schemas/currency-pairs.schema';
import { WhitelistService } from '../whitelist/whitelist.service';
import { ERROR_MESSAGES } from 'src/utils/messages/error.messages';
import { IcurrencyPair } from './interfaces/currencypair.interface';
import { IsmartContract } from './interfaces/smartContract.interface';
import { CreateContractDto } from '../whitelist/dto/createContract.dto';
import { MAXIMUM_PERCENTAGE_DIFFERENCE } from '../utils/common/constants';

@Injectable()
export class ExchangeRatesService {
  constructor(
    @InjectModel(CurrencyPair.name)
    private readonly currencyPiarModel: Model<CurrencyPair>,
    private readonly whiteListService: WhitelistService,
    private readonly blockchainService: BlockchainService,
    @Inject('CACHE_MANAGER') private cacheManager: Cache,
  ) {}

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

        const currencyRate = await this.createRate(
          symbolA,
          symbolB,
          binancePair,
          pairAddressUni,
          isInvalidPair,
        );

        if (currencyRate) {
          const { timeStamp, isCorrect, rate } = currencyRate;
          const rateForCache = {
            timeStamp,
            isCorrect,
            rate,
          };

          await this.cacheManager.set(binancePair, rateForCache, 6000);
        }
      },
    );
  }

  async getRate(
    symbolA: string,
    symbolB: string,
  ): Promise<IrateResponse | undefined> {
    const pair = `${symbolA}${symbolB}`;
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
          throw new BadRequestException(
            ERROR_MESSAGES.pairUnavailable(symbolA, symbolB),
          );
        }
      }

      const currencyRate = await this.createRate(
        symbolA,
        symbolB,
        smartContract.binancePair,
        smartContract.pairAddressUni,
        false,
      );

      if (!currencyRate) {
        throw new BadRequestException(
          ERROR_MESSAGES.pairUnavailable(symbolA, symbolB),
        );
      }

      const { timeStamp, isCorrect, rate } = currencyRate;
      const rateForCache = {
        timeStamp,
        isCorrect,
        rate,
      };

      await this.cacheManager.set(pair, rateForCache, 6000);
      return this.getRate(symbolA, symbolB);
    }

    if (!cache.isCorrect) {
      throw new BadRequestException(
        ERROR_MESSAGES.pairUnavailable(symbolA, symbolB),
      );
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
    if (fromTimestamp > toTimestamp) {
      throw new BadRequestException(ERROR_MESSAGES.emtyDataForTimeStamp());
    }

    const pair: string = `${symbolA}${symbolB}`;
    const historyResp = await this.currencyPiarModel
      .find({
        binancePair: pair,
        timeStamp: {
          $gte: fromTimestamp,
          $lte: toTimestamp,
        },
        isCorrect: { $ne: false },
      })
      .exec();

    const history = historyResp.map(({ timeStamp, rate }) => ({
      timestamp: timeStamp,
      rate,
    }));

    if (!history.length) {
      throw new NotFoundException(ERROR_MESSAGES.noRecords());
    }

    return history;
  }

  private async createRate(
    symbolA: string,
    symbolB: string,
    binancePair: string,
    pancakePair: string,
    isInvalidRates: boolean = false,
  ): Promise<IcurrencyPair> {
    const binancePairData =
      await this.whiteListService.getBinancePair(binancePair);

    if (!binancePairData) {
      throw new BadRequestException(
        ERROR_MESSAGES.pairUnavailable(symbolA, symbolB),
      );
    }

    const pancakePairRate: string =
      await this.blockchainService.getPancakePairRate(pancakePair);

    if (!pancakePairRate) {
      throw new BadRequestException(
        ERROR_MESSAGES.pairUnavailable(symbolA, symbolB),
      );
    }

    const binancePrice = binancePairData[binancePair];
    const percentDiscrepancy: number = this.getPercentDiscrepancy(
      binancePrice,
      pancakePairRate,
    );

    const rate = {
      symbolA,
      symbolB,
      binancePair: binancePair,
      pairAddressUni: pancakePair,
      timeStamp: Date.now(),
      rate: binancePrice,
      isCorrect:
        !isInvalidRates && percentDiscrepancy < MAXIMUM_PERCENTAGE_DIFFERENCE
          ? true
          : false,
    };

    const createdPair = new this.currencyPiarModel(rate);

    return createdPair.save();
  }

  private getPercentDiscrepancy(
    binancePair: string,
    pancakePairRate: string,
  ): number {
    const binancePrice = new BigNumber(binancePair);
    const pancakePrice = new BigNumber(pancakePairRate);
    const percentDiscrepancy = binancePrice
      .minus(pancakePrice)
      .abs()
      .dividedBy(binancePrice)
      .multipliedBy(100)
      .toNumber();

    return percentDiscrepancy;
  }
}
