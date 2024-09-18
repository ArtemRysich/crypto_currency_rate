import { Document } from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema()
export class CurrencyPair extends Document {
  @Prop({ required: true })
  symbolA: string;

  @Prop({ required: true })
  symbolB: string;

  @Prop({ required: true })
  binancePair: string;

  @Prop({ required: true })
  pairAddressUni: string;

  @Prop({ required: true })
  timeStamp: number;

  @Prop({ required: true })
  rate: number;

  @Prop({ required: true })
  isCorrect: boolean;
}

export const CarrencyPairsSchema = SchemaFactory.createForClass(CurrencyPair);
