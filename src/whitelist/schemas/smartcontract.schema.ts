import { Document } from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema()
export class Contract extends Document {
  @Prop({ required: true })
  symbolA: string;

  @Prop({ required: true })
  symbolB: string;

  @Prop({ required: true })
  binancePair: string;

  @Prop({ required: true })
  pairAddressUni: string;
}

export const ContractSchema = SchemaFactory.createForClass(Contract);
