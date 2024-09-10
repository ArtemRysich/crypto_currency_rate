import {
  Controller,
  Post,
  Get,
  Body,
  Res,
  HttpStatus,
  Delete,
  Param,
} from '@nestjs/common';
import { Response } from 'express';
import { WhitelistService } from './whitelist.service';
import { CreateContractDto } from './dto/createContract.dto';
import { ERROR_MESSAGES } from 'src/messages/error.messages';
import { SUCCES_MESSAGES } from 'src/messages/succes.messages';

@Controller('whitelist')
export class WhitelistController {
  constructor(private readonly whiteList: WhitelistService) {}

  @Get()
  async findAll(@Res() resp: Response) {
    const result = await this.whiteList.getAllContratcs();
    if (!result.length) {
      return resp.status(HttpStatus.OK).send({
        msg: SUCCES_MESSAGES.listEmty(),
      });
    }
    return resp.status(HttpStatus.OK).send(result);
  }

  @Post()
  async create(@Body() dto: CreateContractDto, @Res() resp: Response) {
    const isUnicPair = await this.whiteList.isUnicPair(
      `${dto.symbolA}${dto.symbolB}`.toUpperCase(),
    );

    if (!isUnicPair) {
      return resp.status(HttpStatus.BAD_REQUEST).send({
        isUnicPair,
        code: HttpStatus.BAD_REQUEST,
        msg: ERROR_MESSAGES.listAlreadeCreated(dto.symbolA, dto.symbolB),
      });
    }

    const data = await this.whiteList.create(dto);

    if (!data) {
      return resp.status(HttpStatus.BAD_REQUEST).send({
        code: HttpStatus.BAD_REQUEST,
        msg: ERROR_MESSAGES.pairUnavailable(dto.symbolA, dto.symbolB),
      });
    }

    return resp.status(HttpStatus.CREATED).send(data);
  }

  @Delete(':pair')
  async remove(@Param('pair') pair: string, @Res() resp: Response) {
    const result = await this.whiteList.removeContractPair(pair);

    if (!result) {
      return resp.status(HttpStatus.NOT_FOUND).send({
        status: HttpStatus.NOT_FOUND,
        msg: ERROR_MESSAGES.pairNotFound(pair),
      });
    }

    return resp.status(HttpStatus.OK).send({
      status: HttpStatus.OK,
      msg: SUCCES_MESSAGES.pairRemoved(pair),
    });
  }
}
