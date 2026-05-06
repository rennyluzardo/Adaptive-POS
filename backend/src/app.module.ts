import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AgentController } from './controllers/agent.controller';
import { GeminiAdapterService } from './infrastructure/ai/gemini-adapter.service';
import { InventoryService } from './infrastructure/inventory/inventory.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
  ],
  controllers: [AgentController],
  providers: [GeminiAdapterService, InventoryService],
})
export class AppModule {}
