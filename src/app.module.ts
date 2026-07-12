import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { AppController } from './app.controller';
import { WhatsappModule } from './whatsapp/whatsapp.module';
import { CommandModule } from './commands/command.module';

@Module({
  imports: [
    ConfigModule.forRoot(),
    HttpModule,
    WhatsappModule,
    CommandModule,
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
