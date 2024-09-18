import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { MongooseModule } from '@nestjs/mongoose';
import { WhitelistService } from './whitelist.service';
import { WhitelistController } from './whitelist.controller';
import { Contract, ContractSchema } from './schemas/smartcontract.schema';
import { BlockchainService } from 'src/exchange_rates/blockchain.service';

@Module({
  imports: [
    HttpModule,
    MongooseModule.forFeature([
      { name: Contract.name, schema: ContractSchema },
    ]),
  ],
  providers: [WhitelistService, BlockchainService],
  controllers: [WhitelistController],
  exports: [WhitelistService],
})
export class WhitelistModule {}
