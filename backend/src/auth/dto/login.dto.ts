import { IsNotEmpty, Matches, Length } from 'class-validator';

export class LoginDto {
  @IsNotEmpty({ message: 'Phone number is required' })
  @Matches(/^1[3-9]\d{9}$/, { message: 'Invalid phone number format' })
  phoneNumber: string = '';

  @IsNotEmpty({ message: 'Verification code is required' })
  @Length(6, 6, { message: 'Verification code must be 6 digits' })
  @Matches(/^\d{6}$/, { message: 'Verification code must be numeric' })
  code: string = '';
}