import { IQueryHandler, Query, QueryHandler } from '@nestjs/cqrs';
import { PrismaService } from 'src/common/prisma';
import { UserEntity } from 'src/users/entities/user.entity';

export class GetOneUserByEmailQuery extends Query<UserEntity | null> {
  constructor(public readonly props: GetOneUserByEmailQueryProps) {
    super();
  }
}

@QueryHandler(GetOneUserByEmailQuery)
export class GetOneUserByEmailQueryHandler implements IQueryHandler<GetOneUserByEmailQuery> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(query: GetOneUserByEmailQuery): Promise<UserEntity | null> {
    const { email } = query.props;

    const user = await this.prisma.user.findUnique({ where: { email } });

    return user;
  }
}

interface GetOneUserByEmailQueryProps {
  email: string;
}
