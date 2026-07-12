import { Controller, Post, Body, Get } from '@nestjs/common';
import { CommandService } from './commands/command.service';

@Controller()
export class AppController {
  constructor(private readonly commandService: CommandService) {}

  @Get()
  getHello(): string {
    return 'Bot WA is running!';
  }

  @Post('webhook')
  async handleWebhook(@Body() payload: any) {
    // Process async so webhook responds 200 OK immediately
    this.commandService.handleIncomingMessage(payload);
    return { status: 'success' };
  }
}
