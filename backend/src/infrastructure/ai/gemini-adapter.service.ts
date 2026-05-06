import { Injectable } from '@nestjs/common';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { BaseMessage } from '@langchain/core/messages';

@Injectable()
export class GeminiAdapterService {
  private model: ChatGoogleGenerativeAI;

  constructor() {
    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      throw new Error('GOOGLE_API_KEY is not defined in environment variables');
    }

    this.model = new ChatGoogleGenerativeAI({
      apiKey,
      model: 'gemini-3.1-flash-lite-preview',
    });
  }

  async generateResponse(messages: BaseMessage[]): Promise<string> {
    const response = await this.model.invoke(messages);
    return response.content as string;
  }

  getModel(): ChatGoogleGenerativeAI {
    return this.model;
  }
}
