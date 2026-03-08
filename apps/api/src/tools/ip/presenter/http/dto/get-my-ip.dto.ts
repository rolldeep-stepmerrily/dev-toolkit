import { ApiProperty } from '@nestjs/swagger';

export class GetMyIpResponseDto {
  @ApiProperty({ nullable: true })
  ipv4!: string | null;

  @ApiProperty({ nullable: true })
  ipv6!: string | null;

  static from(ipv4: string | null, ipv6: string | null): GetMyIpResponseDto {
    return { ipv4, ipv6 };
  }
}
