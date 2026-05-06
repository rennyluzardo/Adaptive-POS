import { Controller, Post, Body } from '@nestjs/common';
import { AgentInteractionDto } from '../interfaces/agent.interaction.dto';
import { PosGraphBuilder } from '../application/orchestration/pos-graph.builder';
import { GeminiAdapterService } from '../infrastructure/ai/gemini-adapter.service';
import { InventoryService } from '../infrastructure/inventory/inventory.service';
import { CartService } from '../infrastructure/cart/cart.service';
import { AgentState } from '../core/domain';

@Controller('agent')
export class AgentController {
  constructor(
    private geminiAdapter: GeminiAdapterService,
    private inventoryService: InventoryService,
    private cartService: CartService,
  ) {}

  @Post('interact')
  async interact(@Body() dto: AgentInteractionDto): Promise<AgentState> {
    const graphBuilder = new PosGraphBuilder(this.geminiAdapter, this.inventoryService, this.cartService);

    const initialState: AgentState = {
      messages: [{ role: 'user', content: dto.message }],
      currentStep: 'initial',
    };

    return await graphBuilder.invoke(initialState);
  }
}
