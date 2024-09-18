import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ThrottlerModule } from '@nestjs/throttler';
import { WhitelistModule } from './whitelist/whitelist.module';
import { ExchangeRatesModule } from './exchange_rates/exchange_rates.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: `.env`,
      isGlobal: true,
    }),
    MongooseModule.forRoot(process.env.MONGODB_CONNECTION_STRING),
    ThrottlerModule.forRoot([
      {
        name: 'default',
        ttl: 5000,
        limit: 1,
      },
    ]),
    WhitelistModule,
    ExchangeRatesModule,
  ],
})
export class AppModule {}
