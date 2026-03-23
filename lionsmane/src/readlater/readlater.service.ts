import { HttpService } from '@nestjs/axios';
import {
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
  PreconditionFailedException,
} from '@nestjs/common';
import { AxiosError } from '@nestjs/terminus/dist/errors/axios.error';
import { eq } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { catchError, firstValueFrom, map } from 'rxjs';
import { DrizzleAsyncProvider } from '@/drizzle/drizzle.provider';
import { relations } from '@/drizzle/relations';
import * as schema from '@/drizzle/schema';
import { SecretsService } from '@/secrets/secrets.service';

@Injectable()
export class ReadlaterService {
  private readonly logger = new Logger(ReadlaterService.name);
  constructor(
    @Inject(DrizzleAsyncProvider)
    private db: NodePgDatabase<typeof schema, typeof relations>,
    private secrets: SecretsService,
    private readonly httpService: HttpService,
  ) {}

  async addApiKeyAndUrl(userId: string, apiKey: string, url: URL) {
    const secretKeyPath = `secret/data/readlater/${userId}`;
    try {
      await this.secrets.writeSecret(secretKeyPath, {
        apiKey,
        apiUrl: url.toString(),
      });
      await this.db
        .update(schema.user)
        .set({
          hasReadeckKey: true,
        })
        .where(eq(schema.user.id, userId));
    } catch (error) {
      this.logger.error('Error saving readeck API key', error);
      throw new InternalServerErrorException(
        'Error saving the readeck API key',
        { cause: error },
      );
    }
  }

  async addBookmark(articleUrl: URL, userId: string) {
    const secretKeyPath = `secret/data/readlater/${userId}`;
    const apiKey = await this.secrets.readSecret(secretKeyPath);
    if (!apiKey) {
      throw new PreconditionFailedException('Readlater service not configured');
    }

    return await firstValueFrom(
      this.httpService
        .post(
          apiKey.apiUrl + 'api/bookmarks',
          {
            url: articleUrl,
          },
          {
            headers: {
              Authorization: `Bearer ${apiKey.apiKey}`,
              'Content-Type': 'application/json',
            },
          },
        )
        .pipe(
          map((res) => res.data),
          catchError((error: AxiosError) => {
            this.logger.error(error);
            throw Error('Error saving readlater item', { cause: error });
          }),
        ),
    );
  }
}
