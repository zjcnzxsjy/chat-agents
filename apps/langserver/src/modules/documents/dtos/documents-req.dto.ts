import { Transform, Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsIn,
  IsNotEmpty,
  IsNumberString,
  IsObject,
  IsOptional,
  IsString,
  IsUrl,
  ValidateIf,
  ValidateNested,
} from 'class-validator';

class DocumentDto {
  /**
   * URL地址。
   * - 当 type 为 'URL' 时，此字段为必填项。
   */
  @ValidateIf(o => o.type === 'URL')
  @IsUrl({}, { message: 'url 必须是一个有效的 URL 地址' })
  @IsNotEmpty({ message: '当类型为 URL 时，url 字段是必传项' })
  url?: string;

  /**
   * 文档类型。
   */
  @IsIn(['PDF', 'TXT', 'TEXT', 'URL'], {
    message: 'type 的值必须是 PDF, TXT, TEXT, 或 URL 之一',
  })
  @IsNotEmpty({ message: 'type 字段是必传项' })
  type: 'PDF' | 'TXT' | 'TEXT' | 'URL';

  /**
   * 元数据，可选。
   */
  @IsObject({ message: 'metadata 必须是一个对象' })
  @IsOptional()
  metadata: Record<string, any>;
}

export class DocumentsCreateReqDto {
  @IsNotEmpty({ message: '知识库集合ID不能为空' })
  @IsString()
  public readonly collectionId: string;

  // @IsArray({ message: 'documents 字段必须是一个数组' })
  // @ArrayMinSize(1, { message: 'documents 数组至少要包含一个元素' })
  // @ValidateNested({ each: true })
  // @Type(() => DocumentDto)
  // public readonly documents: DocumentDto[];

  @IsString()
  public readonly documents: string;

}

export class DocumentsReqParamsDto {
  @IsNotEmpty({ message: '知识库集合ID不能为空' })
  @IsString()
  public readonly collectionId: string;

  @IsString()
  public readonly limit: string;

  @IsString()
  public readonly offset: string;
}

export class DocumentsDeleteReqDto {
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
  public readonly fileIds: string[];
}

export class DocumentSearchReqDto {
  @IsNotEmpty({ message: '知识库集合ID不能为空' })
  @IsString()
  public readonly collectionId: string;
  
  @IsNotEmpty({ message: '搜索关键词不能为空' })
  @IsString()
  public readonly query: string;

  @IsOptional()
  @IsNumberString()
  public readonly limit: string;

}