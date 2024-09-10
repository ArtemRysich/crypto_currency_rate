import Web3 from 'web3';
import { Model } from 'mongoose';
import { AxiosError } from 'axios';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { catchError, firstValueFrom, map, of } from 'rxjs';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { tokens } from '../utils/tokens';
import { factoryABI } from '../utils/factoriAbi';
import { Contract } from './schemas/smartcontract.schema';
import { CreateContractDto } from './dto/createContract.dto';
import { IErrRespData } from './interfaces/errorResponse.interface';
import { BINANCY_INVALID_PAIR, INVALID_ADDRESS } from 'src/common/constants';

@Injectable()
export class WhitelistService {
  private readonly web3: Web3;
  constructor(
    @InjectModel(Contract.name)
    private readonly contractModel: Model<Contract>,
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.web3 = new Web3('https://bsc-dataseed.binance.org/');
  }

  async create(
    createContractDto: CreateContractDto,
  ): Promise<Contract | undefined> {
    const pair =
      `${createContractDto.symbolA}${createContractDto.symbolB}`.toUpperCase();

    try {
      const binancePair = await firstValueFrom(this.getBinancePair(pair));

      if (binancePair.isInvalidPair) {
        return;
      }

      const pairAddressUni = await this.getPairAddressUni(
        createContractDto.symbolA,
        createContractDto.symbolB,
      );

      if (pairAddressUni === INVALID_ADDRESS) {
        return;
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

  async removeContractPair(pair: string): Promise<Contract | null> {
    return await this.contractModel
      .findOneAndDelete({ binancePair: pair.toUpperCase() })
      .exec();
  }

  getBinancePair(pair: string) {
    return this.httpService
      .get(`https://api.binance.com/api/v3/ticker/price?symbol=${pair}`)
      .pipe(
        map((response) => {
          return response.data;
        }),
        catchError((err: AxiosError) => {
          if (err.response) {
            const errorData: IErrRespData = err.response.data as IErrRespData;

            if (errorData.code === BINANCY_INVALID_PAIR) {
              return of({
                isInvalidPair: true,
              });
            }
          }
        }),
      );
  }

  private async getPairAddressUni(
    symbolA: string,
    symbolB: string,
  ): Promise<string> {
    const tokenA = this.getTokenAddres(symbolA);
    const tokenB = this.getTokenAddres(symbolB);

    const factoryContract = new this.web3.eth.Contract(
      factoryABI,
      this.configService.get<string>('FACTORY_ADDRESS'),
    );
    const pairAddress: string = await factoryContract.methods
      .getPair(tokenA, tokenB)
      .call();

    return pairAddress;
  }

  async isUnicPair(pair: string): Promise<boolean> {
    const result = await this.contractModel
      .findOne({ binancePair: pair })
      .exec();

    return result ? false : true;
  }

  private getTokenAddres(symbol: string): string {
    return tokens[symbol.toUpperCase()];
  }
}
