import Web3 from 'web3';
import BigNumber from 'bignumber.js';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { pairAbi } from 'src/utils/abi/pairAbi';
import { tokens } from 'src/utils/tokens/tokens';
import { ETHER } from 'src/utils/common/constants';
import { factoryABI } from 'src/utils/abi/factoriAbi';
import { Reserves } from './interfaces/reserves.interface';

@Injectable()
export class BlockchainService {
  private readonly web3: Web3;
  constructor(private readonly configService: ConfigService) {
    this.web3 = new Web3(
      new Web3.providers.HttpProvider(
        this.configService.get<string>('WEB3_PROVIDER'),
      ),
    );
  }

  async getPancakePairRate(pancakePair: string): Promise<string> {
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

    const price = new BigNumber(reserveB).dividedBy(new BigNumber(reserveA));

    const formattedPrice: string = price.toFixed(8);

    return formattedPrice;
  }

  async getPairAddressUni(symbolA: string, symbolB: string): Promise<string> {
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

  private getTokenAddres(symbol: string): string {
    return tokens[symbol];
  }
}
