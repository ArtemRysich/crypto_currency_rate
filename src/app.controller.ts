import { Response } from 'express';
import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Post,
  Query,
  Req,
  Res,
} from '@nestjs/common';
import { AppService } from './app.service';
import { ERROR_MESSAGES } from './messages/error.messages';
import { SUCCES_MESSAGES } from './messages/succes.messages';
import { SkipThrottle } from '@nestjs/throttler';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @SkipThrottle({ default: true })
  @Get('getRate')
  async getRate(
    @Query('symbolA') symbolA: string,
    @Query('symbolB') symbolB: string,
    @Res() resp: Response,
  ) {
    const rate = await this.appService.getRate(symbolA, symbolB);

    if (!rate) {
      return resp.status(HttpStatus.BAD_REQUEST).send({
        code: HttpStatus.BAD_REQUEST,
        msg: ERROR_MESSAGES.pairUnavailable(symbolA, symbolB),
      });
    }

    return resp.status(HttpStatus.OK).send(rate);
  }

  @Get('getHistoryRates')
  async getHistoryRates(
    @Query('symbolA') symbolA: string,
    @Query('symbolB') symbolB: string,
    @Query('fromTimestamp') fromTimestamp: number,
    @Query('toTimestamp') toTimestamp: number,
    @Res() resp: Response,
  ) {
    if (fromTimestamp > toTimestamp) {
      return resp.status(HttpStatus.BAD_REQUEST).send({
        status: HttpStatus.BAD_REQUEST,
        msg: ERROR_MESSAGES.emtyDataForTimeStamp(),
      });
    }

    const historyResult = await this.appService.getHistory(
      symbolA,
      symbolB,
      fromTimestamp,
      toTimestamp,
    );

    if (!historyResult.length) {
      return resp.status(HttpStatus.OK).send({
        msg: SUCCES_MESSAGES.noRecords(),
      });
    }
    return resp.status(HttpStatus.OK).send(historyResult);
  }

  @Post('kymemail')
  async getRequest(@Req() req, @Body() body) {
    // console.log(req);
    console.log(body.name);
    console.log(body.phone);
  }
}
