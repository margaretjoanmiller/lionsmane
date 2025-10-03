import { ApiProperty } from '@nestjs/swagger';

export class FileDto {
  @ApiProperty({
    description: 'OPML file to import',
    required: true,
    format: 'binary',
  })
  // biome-ignore lint/suspicious/noExplicitAny: file
  file: any;
}
