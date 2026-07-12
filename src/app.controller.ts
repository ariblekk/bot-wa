import { Controller, Post, Body, Get } from '@nestjs/common';
import { CommandService } from './commands/command.service';

@Controller()
export class AppController {
  constructor(private readonly commandService: CommandService) {}

  @Get()
  getHello(): string {
    return 'Bot WA is running!';
  }

  @Get('webhook')
  getWebhook() {
    return { status: 'active', method: 'POST' };
  }

  @Post('webhook')
  async handleWebhook(@Body() payload: any) {
    this.commandService.handleIncomingMessage(payload);
    return { status: 'success' };
  }
}
