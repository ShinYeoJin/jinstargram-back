import { IsString, IsNotEmpty } from 'class-validator';

export class CheckAvailabilityDto {
  @IsString()
  @IsNotEmpty()
  value: string;
}

