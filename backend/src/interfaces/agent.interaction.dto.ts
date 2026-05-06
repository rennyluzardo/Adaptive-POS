import { IsString, IsNotEmpty } from 'class-validator';

export class AgentInteractionDto {
  @IsString()
  @IsNotEmpty()
  message: string;
}
