import { Module } from '@nestjs/common';
import { CommandService } from './command.service';
import { WhatsappModule } from '../whatsapp/whatsapp.module';

@Module({
  imports: [WhatsappModule],
  providers: [CommandService],
  exports: [CommandService],
})
export class CommandModule {}
