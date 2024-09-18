import {
  Controller,
  Post,
  Get,
  Body,
  Delete,
  Param,
} from '@nestjs/common';
import { WhitelistService } from './whitelist.service';
import { CreateContractDto } from './dto/createContract.dto';
import { UppercasePipe } from 'src/utils/pipes/uppercase.pipe';

@Controller('whitelist')
export class WhitelistController {
  constructor(private readonly whiteList: WhitelistService) {}

  @Get()
  async findAll() {
    return await this.whiteList.getAllContratcs();
  }

  @Post()
  async create(@Body() dto: CreateContractDto) {
    return await this.whiteList.create(dto);
  }

  @Delete(':pair')
  async remove(@Param('pair', UppercasePipe) pair: string) {
    return await this.whiteList.removeContractPair(pair);
  }
}
