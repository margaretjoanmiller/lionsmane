import { Injectable } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class ReadlaterService {
  async addBookmark(articleUrl: URL, userId: string) {}
}
