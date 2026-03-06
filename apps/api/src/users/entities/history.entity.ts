import { ApiProperty } from '@nestjs/swagger';

export class HistoryEntity {
  @ApiProperty()
  toolId!: string;

  @ApiProperty()
  usedAt!: Date;
}
