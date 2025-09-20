import { HttpService } from '@nestjs/axios';
import {
  Injectable,
  InternalServerErrorException,
  Logger,
  PreconditionFailedException,
} from '@nestjs/common';
import { catchError } from 'rxjs';
import { AxiosError } from '@nestjs/terminus/dist/errors/axios.error';
import { SecretsService } from 'src/secrets/secrets.service';

@Injectable()
export class ReadlaterService {
  private readonly logger = new Logger(ReadlaterService.name);
  constructor(
    private secrets: SecretsService,
    private readonly httpService: HttpService,
  ) {}

  async addApiKeyAndUrl(userId: string, apiKey: string, url: URL) {
    const secretKeyPath = `secret/data/readlater/${userId}`;
    await this.secrets.writeSecret(secretKeyPath, {
      apiKey,
      apiUrl: url.toString(),
    });
  }

  async addBookmark(articleUrl: URL, userId: string) {
    const secretKeyPath = `secret/data/readlater/${userId}`;
    const apiKey = await this.secrets.readSecret(secretKeyPath);
    if (!apiKey) {
      throw new PreconditionFailedException('Readlater service not configured');
    }

    return this.httpService
      .post(
        apiKey.apiUrl + 'api/bookmarks',
        {
          url: articleUrl.toString(),
        },
        {
          headers: {
            Authorization: `Bearer ${apiKey.apiKey}`,
            'Content-Type': 'application/json',
          },
        },
      )
      .pipe(
        catchError((error: AxiosError) => {
          this.logger.error(error);
          throw Error('Error saving readlater item', { cause: error });
        }),
      );
  }
}
