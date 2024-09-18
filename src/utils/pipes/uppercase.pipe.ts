import {
  PipeTransform,
  Injectable,
  BadRequestException,
} from '@nestjs/common';

@Injectable()
export class UppercasePipe implements PipeTransform {
  transform(value: any) {
    if (typeof value === 'string') {
      return value.toUpperCase();
    }
    throw new BadRequestException('The value must be a string');
  }
}
