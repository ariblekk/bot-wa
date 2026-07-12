import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { WhatsappService } from './whatsapp.service';

@Module({
  imports: [ConfigModule, HttpModule],
  providers: [WhatsappService],
  exports: [WhatsappService],
})
export class WhatsappModule {}
