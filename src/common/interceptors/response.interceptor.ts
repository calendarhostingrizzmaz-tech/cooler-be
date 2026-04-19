import { isArray } from 'class-validator';
import { CallHandler, ExecutionContext, NestInterceptor } from '@nestjs/common';
import { map } from 'rxjs';

export interface Response<T> {
  data: T;
}

function isPaginatedListPayload(data: unknown): data is {
  data: unknown[];
  lastPage: number;
  page?: number;
  total?: number;
} {
  if (data === null || typeof data !== 'object' || Array.isArray(data)) {
    return false;
  }
  const d = data as Record<string, unknown>;
  return 'lastPage' in d && isArray(d.data);
}

export class ResponseInterceptor<T> implements NestInterceptor<T, Response<T>> {
  intercept(context: ExecutionContext, next: CallHandler) {
    const call$ = next.handle();
    const response = context.switchToHttp().getResponse();
    const request = context.switchToHttp().getRequest();

    return call$.pipe(
      map((data) => {
        const payload = isPaginatedListPayload(data)
          ? data
          : isArray(data?.data)
            ? data.data
            : data?.data ?? data ?? null;

        return {
          statusCode: data?.status || response.statusCode,
          message: data?.message
            ? data?.message
            : request.method === 'POST'
              ? 'Record saved successfully. ✅'
              : request.method === 'PATCH' || request.method === 'PUT'
                ? 'Record updated successfully. ✅'
                : request.method === 'DELETE'
                  ? 'Record deleted successfully. 🗑️'
                  : 'Operation successful. ✔️',
          data: payload,
          metadata: data?.metaInfo,
        };
      }),
    );
  }
}
