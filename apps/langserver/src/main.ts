import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ResponseTransformInterceptor } from './common/interceptor/response-transform';
import { HttpException, HttpStatus, ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const PREFIX = 'api';

  const app = await NestFactory.create(AppModule);

  // 启用 CORS
  app.enableCors();
  // 设置全局前缀
  app.setGlobalPrefix(PREFIX);
  // 全局拦截器
  app.useGlobalInterceptors(new ResponseTransformInterceptor());
  // 全局验证管道
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // 自动剥离请求体中未在 DTO 中定义的属性
      forbidNonWhitelisted: true, // 如果存在未在 DTO 中定义的属性，则抛出错误 (配合 whitelist)
      transform: true, // 自动将传入的普通 JS 对象转换为 DTO 类的实例 (重要!)
      disableErrorMessages: process.env.NODE_ENV === 'production', // 生产环境可选禁用详细错误消息
      exceptionFactory: (errors) => {
        throw new HttpException(
          { message: '请求参数验证失败 ', error: errors },
          HttpStatus.BAD_REQUEST,
      );
      },
    }),
  );

  await app.listen(process.env.PORT ?? 8080);
}
bootstrap();
