import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import type { RedisClientOptions } from 'redis';
import { ScheduleModule } from '@nestjs/schedule';
import { MongooseModule } from '@nestjs/mongoose';
import { ThrottlerGuard } from '@nestjs/throttler';
import { CacheModule } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-redis-store';
import { ExchangeRatesService } from './exchange_rates.service';
import { ExchangeRatesController } from './exchange_rates.controller';
import {
  CarrencyPairsSchema,
  CurrencyPair,
} from './schemas/currency-pairs.schema';
import { BlockchainService } from './blockchain.service';
import { WhitelistModule } from 'src/whitelist/whitelist.module';

@Module({
  imports: [
    CacheModule.register<RedisClientOptions>({
      store: redisStore,
      host: process.env.REDIS_HOST,
      port: process.env.REDIS_PORT,
    }),
    ScheduleModule.forRoot(),
    MongooseModule.forFeature([
      { name: CurrencyPair.name, schema: CarrencyPairsSchema },
    ]),
    WhitelistModule,
  ],
  controllers: [ExchangeRatesController],
  providers: [
    ExchangeRatesService,
    BlockchainService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class ExchangeRatesModule {}
