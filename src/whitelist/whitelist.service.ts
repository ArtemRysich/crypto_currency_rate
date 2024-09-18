import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import Binance, { Binance as IBinance } from 'binance-api-node';
import { Contract } from './schemas/smartcontract.schema';
import { INVALID_ADDRESS } from '../utils/common/constants';
import { CreateContractDto } from './dto/createContract.dto';
import { ERROR_MESSAGES } from 'src/utils/messages/error.messages';
import { BlockchainService } from 'src/exchange_rates/blockchain.service';

@Injectable()
export class WhitelistService {
  private readonly binanceClient: IBinance;
  constructor(
    @InjectModel(Contract.name)
    private readonly contractModel: Model<Contract>,
    private readonly blockchainService: BlockchainService,
  ) {
    this.binanceClient = Binance();
  }

  async create(createContractDto: CreateContractDto): Promise<Contract> {
    const { symbolA, symbolB } = createContractDto;
    const pair = `${symbolA}${symbolB}`;

    const isUnicPair = await this.isUnicPair(pair);

    if (!isUnicPair) {
      throw new BadRequestException(
        ERROR_MESSAGES.listAlreadeCreated(symbolA, symbolB),
      );
    }

    try {
      const binancePair = await this.getBinancePair(pair);

      if (!binancePair) {
        throw new BadRequestException(
          ERROR_MESSAGES.pairUnavailable(symbolA, symbolB),
        );
      }

      const pairAddressUni = await this.blockchainService.getPairAddressUni(
        symbolA,
        symbolB,
      );

      if (pairAddressUni === INVALID_ADDRESS) {
        throw new BadRequestException(
          ERROR_MESSAGES.pairUnavailable(symbolA, symbolB),
        );
      }

      const contract = {
        binancePair: pair,
        pairAddressUni: pairAddressUni,
        ...createContractDto,
      };

      const createContract = new this.contractModel(contract);

      return await createContract.save();
    } catch (error) {
      throw new HttpException(error, HttpStatus.SERVICE_UNAVAILABLE);
    }
  }

  async getAllContratcs(): Promise<Contract[]> {
    return await this.contractModel.find().exec();
  }

  async removeContractPair(pair: string): Promise<Contract> {
    const removedPair = await this.contractModel
      .findOneAndDelete({ binancePair: pair })
      .exec();

    if (!removedPair) {
      throw new NotFoundException(ERROR_MESSAGES.pairNotFound(pair));
    }

    return removedPair;
  }

  async getBinancePair(symbol: string) {
    return await this.binanceClient.prices({ symbol });
  }

  async isUnicPair(pair: string): Promise<boolean> {
    const result = await this.contractModel
      .findOne({ binancePair: pair })
      .exec();

    return result ? false : true;
  }
}
