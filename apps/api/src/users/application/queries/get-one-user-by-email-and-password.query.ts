import { IQueryHandler, Query, QueryHandler } from '@nestjs/cqrs';
import { PrismaService } from 'src/common/prisma';
import { UserEntity } from 'src/users/entities/user.entity';

export class GetOneUserByEmailAndPasswordQuery extends Query<UserEntity | null> {
  constructor(public readonly props: GetOneUserByEmailAndPasswordQueryProps) {
    super();
  }
}

@QueryHandler(GetOneUserByEmailAndPasswordQuery)
export class GetOneUserByEmailAndPasswordQueryHandler implements IQueryHandler<GetOneUserByEmailAndPasswordQuery> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(query: GetOneUserByEmailAndPasswordQuery): Promise<UserEntity | null> {
    const { email, password } = query.props;

    const user = await this.prisma.user.findUnique({ where: { email, password } });

    return user;
  }
}

interface GetOneUserByEmailAndPasswordQueryProps {
  email: string;
  password: string;
}
