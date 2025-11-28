import { IsNotEmpty, Matches } from 'class-validator';

export class SendCodeDto {
  @IsNotEmpty({ message: 'Phone number is required' })
  @Matches(/^1[3-9]\d{9}$/, { message: 'Invalid phone number format' })
  phoneNumber: string = '';
}