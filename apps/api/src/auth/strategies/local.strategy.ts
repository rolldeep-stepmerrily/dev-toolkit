import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';

import { AuthService } from '../auth.service';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy, 'local') {
  constructor(private readonly authService: AuthService) {
    super({ usernameField: 'email' });
  }

  /**
   * 이메일/비밀번호로 사용자 유효성을 검증
   *
   * @param {string} email 사용자 이메일
   * @param {string} password 사용자 비밀번호
   * @returns {Promise<object>} 검증된 사용자 정보
   */
  validate(email: string, password: string): Promise<object> {
    return this.authService.validateLocalUser(email, password);
  }
}
