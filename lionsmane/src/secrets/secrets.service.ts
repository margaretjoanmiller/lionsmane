import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createCipheriv, createDecipheriv, randomBytes, scrypt } from 'crypto';
import { promisify } from 'util';

@Injectable()
export class SecretsService {
  constructor(private config: ConfigService) {}

  async encrypt(toEncrypt: string) {
    const password = this.config.getOrThrow<string>('SECRET_KEY');

    const iv = randomBytes(16);

    const key = (await promisify(scrypt)(password, 'salt', 32)) as Buffer;
    const cipher = createCipheriv('aes-256-ctr', key, iv);

    return {
      encrypted: Buffer.concat([cipher.update(toEncrypt), cipher.final()]),
      iv,
    };
  }

  async decrypt(toDecrypt: {
    encrypted: Buffer<ArrayBuffer>;
    iv: Buffer<ArrayBufferLike>;
  }) {
    const password = this.config.getOrThrow<string>('SECRET_KEY');

    const key = (await promisify(scrypt)(password, 'salt', 32)) as Buffer;
    const decipher = createDecipheriv('aes-256-ctr', key, toDecrypt.iv);
    return Buffer.concat([
      decipher.update(toDecrypt.encrypted),
      decipher.final(),
    ]).toString();
  }
}
