const API_URL = process.env.NEXT_PUBLIC_API_URL;

export class ApiError extends Error {
  constructor(
    public statusCode: number,
    public errorCode: string,
    message: string,
  ) {
    super(message);
  }
}

/**
 * API 서버에 요청을 보내고 응답을 반환
 *
 * @param {string} path API 경로
 * @param {RequestInit & { token?: string }} [options] fetch 옵션 및 인증 토큰
 * @returns {Promise<T>} 파싱된 응답 데이터
 * @throws {ApiError} HTTP 오류 응답인 경우
 */
export const apiFetch = async <T>(
  path: string,
  options?: RequestInit & { token?: string },
): Promise<T> => {
  const { token, ...fetchOptions } = options ?? {};

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(fetchOptions.headers as Record<string, string>),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${path}`, { ...fetchOptions, headers });

  if (!res.ok) {
    const error = await res.json();
    throw new ApiError(error.statusCode, error.errorCode, error.message);
  }

  const json = await res.json();

  return (json.data ?? json) as T;
};
