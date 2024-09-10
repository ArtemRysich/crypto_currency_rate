import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { MongooseModule } from '@nestjs/mongoose';
import { WhitelistService } from './whitelist.service';
import { WhitelistController } from './whitelist.controller';
import { Contract, ContractSchema } from './schemas/smartcontract.schema';

@Module({
  imports: [
    HttpModule,
    MongooseModule.forFeature([
      { name: Contract.name, schema: ContractSchema },
    ]),
  ],
  providers: [WhitelistService],
  controllers: [WhitelistController],
  exports: [WhitelistService],
})
export class WhitelistModule {}
