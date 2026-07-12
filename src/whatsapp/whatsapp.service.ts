import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class WhatsappService implements OnModuleInit {
  private readonly logger = new Logger(WhatsappService.name);
  public readonly adminPhones: string[];
  public readonly gowaUrl: string;
  private readonly gowaDeviceId: string;
  private readonly gowaAuthToken: string;

  constructor(
    private configService: ConfigService,
    private httpService: HttpService,
  ) {
    this.adminPhones = (this.configService.get<string>('ADMIN_PHONE') || '')
      .split(',')
      .map((p) => p.trim())
      .filter(Boolean);
    this.gowaUrl = this.configService.get<string>('GOWA_URL') || 'http://localhost:3000';
    this.gowaDeviceId = this.configService.get<string>('GOWA_DEVICE_ID') || '';
    this.gowaAuthToken = this.configService.get<string>('GOWA_AUTH_TOKEN') || '';
  }

  async onModuleInit() {
    this.logger.log('--- Mengecek Konfigurasi GOWA ---');
    this.logger.log(`GOWA_URL: ${this.gowaUrl}`);
    this.logger.log(`GOWA_DEVICE_ID: ${this.gowaDeviceId ? 'Terisi' : 'KOSONG'}`);
    this.logger.log(`GOWA_AUTH_TOKEN: ${this.gowaAuthToken ? 'Terisi' : 'KOSONG'}`);
    this.logger.log(`ADMIN_PHONE: ${this.adminPhones.join(', ')}`);

    if (this.adminPhones.length && this.gowaDeviceId && this.gowaAuthToken) {
      this.logger.log('Konfigurasi .env GOWA lengkap.');
    } else {
      this.logger.warn('Konfigurasi di .env belum lengkap.');
    }
  }

  private getAuthHeader(): string {
    const isBasicAuth = this.gowaAuthToken.includes(':');
    return isBasicAuth
      ? `Basic ${Buffer.from(this.gowaAuthToken).toString('base64')}`
      : `Bearer ${this.gowaAuthToken}`;
  }

  async sendMessage(to: string, text: string) {
    try {
      const url = `${this.gowaUrl}/send/message`;
      const response = await firstValueFrom(
        this.httpService.post(
          url,
          {
            device_id: this.gowaDeviceId,
            phone: to,
            message: text,
          },
          {
            headers: { Authorization: this.getAuthHeader() },
          }
        )
      );
      this.logger.log(`Message sent successfully to ${to}`);
      return response.data;
    } catch (error: any) {
      this.logger.error(`Failed to send message: ${error.message}`);
    }
  }

  async sendSticker(to: string, stickerUrl: string) {
    try {
      const url = `${this.gowaUrl}/send/sticker`;
      const response = await firstValueFrom(
        this.httpService.post(
          url,
          {
            device_id: this.gowaDeviceId,
            phone: to,
            sticker_url: stickerUrl,
          },
          {
            headers: { Authorization: this.getAuthHeader() },
          }
        )
      );
      this.logger.log(`Sticker sent successfully to ${to}`);
      return response.data;
    } catch (error: any) {
      this.logger.error(`Failed to send sticker: ${error.message}`);
    }
  }

  async sendChatPresence(to: string, action: 'start' | 'stop') {
    try {
      const url = `${this.gowaUrl}/send/chat-presence`;
      // Phone must be in JID format: 628xxx@s.whatsapp.net
      const phone = to.includes('@') ? to : `${to}@s.whatsapp.net`;
      const response = await firstValueFrom(
        this.httpService.post(
          url,
          { phone, action },
          {
            headers: {
              Authorization: this.getAuthHeader(),
              'X-Device-Id': this.gowaDeviceId,
            },
          }
        )
      );
      this.logger.log(`Chat presence '${action}' sent to ${to}`);
      return response.data;
    } catch (error: any) {
      this.logger.error(`Failed to send chat presence: ${error.message}`);
    }
  }

  /**
   * Wraps any async operation with typing presence.
   * Sends "start" before, runs the callback, then sends "stop" after.
   * Use this for every reply/command so the bot feels more natural.
   *
   * Example:
   *   await this.whatsappService.withTyping(from, () => this.whatsappService.sendMessage(from, 'Halo!'));
   */
  async withTyping<T>(to: string, fn: () => Promise<T>): Promise<T> {
    await this.sendChatPresence(to, 'start');
    try {
      return await fn();
    } finally {
      await this.sendChatPresence(to, 'stop');
    }
  }
}

