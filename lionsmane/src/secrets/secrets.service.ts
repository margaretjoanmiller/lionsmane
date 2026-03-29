import {
  CipherGCMTypes,
  createCipheriv,
  createDecipheriv,
  randomBytes,
} from 'node:crypto';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { coreSchema } from '@/db';
import { DrizzleAsyncProvider } from '@/drizzle/drizzle.provider';
import { relations } from '@/drizzle/relations';

const ALGORITHM: CipherGCMTypes = 'aes-256-gcm';

@Injectable()
export class SecretsService {
  private readonly logger = new Logger(SecretsService.name);
  private readonly encryptionKey: Buffer;

  constructor(
    private config: ConfigService,
    @Inject(DrizzleAsyncProvider)
    private db: NodePgDatabase<typeof coreSchema, typeof relations>,
  ) {
    const keyHex = this.config.getOrThrow<string>('ENCRYPTION_KEY');
    this.encryptionKey = Buffer.from(keyHex, 'hex');
  }

  encrypt(plaintext: string): {
    encrypted: string;
    iv: string;
    authTag: string;
  } {
    const iv = randomBytes(12).toString('base64');
    const cipher = createCipheriv(
      ALGORITHM,
      this.encryptionKey,
      Buffer.from(iv, 'base64'),
    );
    let encrypted = cipher.update(plaintext, 'utf-8', 'base64');
    encrypted += cipher.final('base64');
    const authTag = cipher.getAuthTag().toString('base64');
    return { encrypted, iv, authTag };
  }

  decrypt(encrypted: string, iv: string, authTag: string): string {
    const decipher = createDecipheriv(
      ALGORITHM,
      this.encryptionKey,
      Buffer.from(iv, 'base64'),
    );
    decipher.setAuthTag(Buffer.from(authTag, 'base64'));
    let str = decipher.update(encrypted, 'base64', 'utf8');
    str += decipher.final('utf8');
    return str;
  }

  async readSecret(
    userId: string,
  ): Promise<{ apiKey: string; apiUrl: string } | null> {
    const row = await this.db.query.readeckConfig.findFirst({
      where: {
        userId,
      },
    });
    if (!row) return null;

    const payload = this.decrypt(row.encryptedPayload, row.iv, row.authTag);
    return JSON.parse(payload) as { apiKey: string; apiUrl: string };
  }

  async writeSecret(
    userId: string,
    data: { apiKey: string; apiUrl: string },
  ): Promise<void> {
    const { encrypted, iv, authTag } = this.encrypt(JSON.stringify(data));

    await this.db
      .insert(coreSchema.readeckConfig)
      .values({
        userId,
        encryptedPayload: encrypted,
        iv,
        authTag,
      })
      .onConflictDoUpdate({
        target: coreSchema.readeckConfig.userId,
        set: { encryptedPayload: encrypted, iv, authTag },
      });

    this.logger.log(`Wrote readeck config for user ${userId}`);
  }
}
