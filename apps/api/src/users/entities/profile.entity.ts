import { ApiProperty } from '@nestjs/swagger';

export class ProfileEntity {
  @ApiProperty()
  id!: number;

  @ApiProperty()
  email!: string;

  @ApiProperty({ nullable: true })
  name!: string | null;

  @ApiProperty({ nullable: true })
  avatarUrl!: string | null;

  @ApiProperty({ description: '이메일/비밀번호 로그인 사용 여부' })
  hasPassword!: boolean;

  @ApiProperty()
  createdAt!: Date;
}
