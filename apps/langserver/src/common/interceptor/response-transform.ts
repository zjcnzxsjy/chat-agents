import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { instanceToPlain } from 'class-transformer'; // Optional: for DTO transformation

export interface StandardResponse<T> {
  statusCode: number;
  message: string;
  data: T;
}

@Injectable()
export class ResponseTransformInterceptor<T>
  implements NestInterceptor<T, StandardResponse<T>> {
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<StandardResponse<T>> {
    const httpContext = context.switchToHttp();
    const response = httpContext.getResponse(); // Get Express/Fastify response object

    return next.handle().pipe(
      map((data) => {
        // 'data' here is what your controller method returns
        // You might have a base DTO that your controller returns,
        // or it could be any data structure.

        // Optionally transform DTOs to plain objects if using class-transformer
        const plainData = instanceToPlain(data);

        return {
          statusCode: response.statusCode, // Get actual status code set by NestJS
          message: data?.message || 'Success', // Allow data to override default message
          data: (plainData || data) as T, // Use plainData if transformed, else original data
        };
      }),
    );
  }
}