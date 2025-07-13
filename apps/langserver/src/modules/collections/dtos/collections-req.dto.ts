import { Transform } from 'class-transformer';
import { IsArray, IsNotEmpty, IsObject, IsString } from 'class-validator';

export class CollectionsReqBodyDto {
  @IsNotEmpty({ message: '知识库集合名称不能为空' })
  @IsString()
  public readonly name: string;

  @IsObject()
  public readonly metadata: Record<string, any>;

}

export class CollectionsReqParamsDto {
  @IsNotEmpty({ message: '知识库集合ID不能为空' })
  @IsString()
  public readonly collectionId: string;
}

export class CollectionsDeteleReqDto {
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return [value.trim()].filter(Boolean); // 转换为单元素数组，并移除可能的空字符串
    }
    if (Array.isArray(value)) {
      // 对数组元素进行trim和过滤空字符串
      return value.map(item => typeof item === 'string' ? item.trim() : item).filter(Boolean);
    }
    return value; // 如果不是字符串或数组，保持原样，让后续校验处理
  })
  @IsArray()
  @IsString({ each: true })
  public readonly ids: string[];
}
