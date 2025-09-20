import { Injectable, InternalServerErrorException } from '@nestjs/common';
import axios from 'axios';
import { SecretsService } from 'src/secrets/secrets.service';

@Injectable()
export class ReadlaterService {
  constructor(private secrets: SecretsService) {}

  async addApiKeyAndUrl(userId: string, apiKey: string, url: URL) {
    const secretKeyPath = `secret/data/readlater/token/${userId}`;
    const secretURLPath = `secret/data/readlater/url/${userId}`;
    await this.secrets.writeSecret(secretKeyPath, apiKey);
    await this.secrets.writeSecret(secretURLPath, url.toString());
  }

  async addBookmark(articleUrl: URL, userId: string) {
    const secretKeyPath = `secret/data/readlater/token/${userId}`;
    const secretURLPath = `secret/data/readlater/url/${userId}`;
    const apiKey = await this.secrets.readSecret(secretKeyPath);
    const apiUrl = await this.secrets.readSecret(secretURLPath);
    if (!apiKey || !apiUrl) {
      throw new Error('Readlater service not configured');
    }

    const res = await axios.post(
      apiUrl + '/api/bookmarks',
      {
        url: articleUrl.toString(),
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      },
    );

    if (res.status !== 202) {
      throw new InternalServerErrorException(
        `Failed to add bookmark ${res.statusText}`,
      );
    }

    return res.data;
  }
}
