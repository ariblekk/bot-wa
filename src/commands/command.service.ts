import { Injectable, Logger } from '@nestjs/common';
import { WhatsappService } from '../whatsapp/whatsapp.service';

@Injectable()
export class CommandService {
  private readonly logger = new Logger(CommandService.name);

  constructor(private readonly whatsappService: WhatsappService) {}

  async handleIncomingMessage(payload: any) {
    this.logger.log(`Received payload: ${JSON.stringify(payload)}`);

    const event = payload?.event;
    const messageData = payload?.payload || payload?.data || payload; 
    
    // We only care about new messages
    if (event && event !== 'message') {
      return;
    }

    const from = messageData?.from;
    let body = messageData?.body || messageData?.text || '';

    // Check for image payload
    let imageUrl = '';
    if (messageData?.image) {
      if (typeof messageData.image === 'string') {
        imageUrl = messageData.image;
      } else if (messageData.image.url) {
        imageUrl = messageData.image.url;
        body = messageData.image.caption || body;
      } else if (messageData.image.path) {
        imageUrl = messageData.image.path;
        body = messageData.image.caption || body;
      }
    }

    // Clean up 'from' (GOWA often uses 628xxx@s.whatsapp.net format)
    const senderNumber = from?.split('@')[0];

    // Check if it's from admin
    if (!senderNumber || !this.whatsappService.adminPhones.includes(senderNumber)) {
      this.logger.log(`Ignored message from ${senderNumber}, not admin.`);
      return;
    }

    this.logger.log(`Message from admin: ${body}, Image: ${imageUrl}`);

    const command = body.trim().toLowerCase();

    // Command Switcher
    switch (command) {
      case '!sticker':
        await this.handleStickerCommand(from, imageUrl);
        break;
      case '!ping':
        await this.whatsappService.withTyping(from, () =>
          this.whatsappService.sendMessage(from, 'Server is online ✅'),
        );
        break;
      case '!menu':
        await this.whatsappService.withTyping(from, () =>
          this.whatsappService.sendMessage(from, '📜 *Menu Bot*\n\n1. `!ping` - Cek status bot\n2. `!sticker` - Kirim gambar dengan caption ini untuk membuat sticker'),
        );
        break;
      default:
        // Autoreply logic for unrecognized commands or normal chat
        await this.whatsappService.withTyping(from, () =>
          this.whatsappService.sendMessage(from, `Halo Admin! Bot menerima pesan: "${body}"\n\n- Autoreply dari bot NestJS`),
        );
        break;
    }
  }

  private async handleStickerCommand(from: string, imageUrl: string) {
    if (!imageUrl) {
      await this.whatsappService.withTyping(from, () =>
        this.whatsappService.sendMessage(from, '❌ Mana gambarnya? Kirim gambar dengan caption `!sticker` untuk membuat sticker.'),
      );
      return;
    }

    const fullImageUrl = imageUrl.startsWith('http') 
      ? imageUrl 
      : `${this.whatsappService.gowaUrl}/${imageUrl.replace(/^\//, '')}`;

    await this.whatsappService.withTyping(from, () =>
      this.whatsappService.sendSticker(from, fullImageUrl),
    );
  }
}
