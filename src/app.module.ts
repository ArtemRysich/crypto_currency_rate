import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { MongooseModule } from '@nestjs/mongoose';
import { CacheModule } from '@nestjs/cache-manager';
import { AppService } from './app.service';
import type { RedisClientOptions } from 'redis';
// import { ENVIRONMENT } from './common/constants';
import { AppController } from './app.controller';
import { redisStore } from 'cache-manager-redis-store';
import { WhitelistModule } from './whitelist/whitelist.module';
import {
  CarrencyPairsSchema,
  CurrencyPair,
} from './schemas/currency-pairs.schema';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: `.env`,
      isGlobal: true,
    }),
    CacheModule.register<RedisClientOptions>({
      store: redisStore,
      host: process.env.REDIS_HOST,
      port: process.env.REDIS_PORT,
    }),
    MongooseModule.forRoot(process.env.MONGODB_CONNECTION_STRING),
    MongooseModule.forFeature([
      { name: CurrencyPair.name, schema: CarrencyPairsSchema },
    ]),
    ThrottlerModule.forRoot([
      {
        name: 'default',
        ttl: 5000,
        limit: 1,
      },
    ]),
    ScheduleModule.forRoot(),
    WhitelistModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
