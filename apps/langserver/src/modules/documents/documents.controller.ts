import {
  ArgumentMetadata,
  BadRequestException,
  Body,
  Controller,
  Delete,
  FileTypeValidator,
  Get,
  Injectable,
  MaxFileSizeValidator,
  ParseFilePipe,
  PipeTransform,
  Post,
  Query,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { DocumentsService } from './documents.service';
import { DocumentBase } from 'src/types';
import {
  DocumentsCreateReqDto,
  DocumentsDeleteReqDto,
  DocumentSearchReqDto,
  DocumentsReqParamsDto,
} from './dtos/documents-req.dto';
import { FilesInterceptor } from '@nestjs/platform-express';

@Injectable()
export class TrimMimetypePipe implements PipeTransform {
  transform(files: Array<Express.Multer.File>, metadata: ArgumentMetadata): Array<Express.Multer.File> {
    // 如果没有文件或不是数组，直接返回
    console.log('files', files);
    if (!files || !Array.isArray(files)) {
      return files;
    }

    // 遍历数组，对每个文件的 mimetype 进行 trim
    files.forEach(file => {
      if (file && file.mimetype) {
        file.mimetype = file.mimetype.trim();
      }
    });

    return files;
  }
}

@Injectable()
export class CustomFileValidationPipe implements PipeTransform {
  async transform(files: Array<Express.Multer.File>, metadata: ArgumentMetadata): Promise<Array<Express.Multer.File>> {
    // 1. 处理 fileIsRequired: false 的情况
    if (!files || files.length === 0) {
      return files; // 如果没有文件，直接通过
    }

    // 2. 定义验证规则
    const maxSize = 10 * 1024 * 1024; // 10 MB
    const allowedMimeTypes = /^(application\/pdf|text\/plain)$/;

    // 3. 遍历并验证每个文件
    for (const file of files) {
      // 3.1 Trim Mimetype
      if (file.mimetype) {
        file.mimetype = file.mimetype.trim();
      }
      
      // 3.2 验证文件大小
      if (file.size > maxSize) {
        throw new BadRequestException(`Validation failed: File '${file.originalname}' exceeds the size limit of 10MB.`);
      }

      // 3.3 验证文件类型
      if (!allowedMimeTypes.test(file.mimetype)) {
        // 抛出带有详细信息的错误，这对于调试至关重要！
        throw new BadRequestException(`Validation failed: File '${file.originalname}' has an invalid mimetype '${file.mimetype}'. Expected one of: application/pdf, text/plain.`);
      }
    }

    // 4. 如果所有文件都通过验证，返回处理过的文件数组
    return files;
  }
}

@Controller('collection/documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Get()
  async getDocuments(@Query() params: DocumentsReqParamsDto): Promise<DocumentBase[]> {
    const { collectionId, limit, offset } = params;
    return this.documentsService.list(collectionId, Number(limit), Number(offset));
  }

  @Post()
  @UseInterceptors(FilesInterceptor('files'))
  async createDocument(
    @UploadedFiles(
      // TrimMimetypePipe,
      // new ParseFilePipe({
      //   validators: [
      //     new MaxFileSizeValidator({ maxSize: 1024 * 1024 * 10 }),
      //     new FileTypeValidator({ fileType: new RegExp('^(application\\/pdf|text\\/plain)$') }),
      //   ],
      //   // fileIsRequired: false,
      // })
      new CustomFileValidationPipe()
    )
    files: Array<Express.Multer.File>,
    @Body() body: DocumentsCreateReqDto
  ) {
    const documents = JSON.parse(body.documents);
    const fileDocs = documents.filter(d => d.type !== 'URL');
    if (!files && fileDocs.length > 0) {
      throw new BadRequestException('缺少需要上传的文件。');
    }
    if (files && files.length !== fileDocs.length) {
      throw new BadRequestException('文件数量与需要上传的文档元数据数量不匹配');
    }
    // 将文件和元数据组合成逻辑上的完整 Document 对象
    const combinedDocuments = documents.map(docDto => {
      if (docDto.type !== 'URL') {
        // 如果类型不是 URL，则必须有一个对应的文件
        const correspondingFile = files.shift(); // 从文件数组中取出一个
        if (!correspondingFile) {
          throw new BadRequestException(`类型为 ${docDto.type} 的文档缺少对应的上传文件。`);
        }
        return {
          ...docDto,
          content: correspondingFile, // 将文件和元数据组合
        };
      } else {
        // 如果类型是 URL，则直接使用 DTO
        return docDto;
      }
    });
    return this.documentsService.create({ collectionId: body.collectionId, documents: combinedDocuments });
  }

  @Delete()
  async deleteDocument(@Query() query: DocumentsDeleteReqDto) {
    return this.documentsService.batchDelete(query.fileIds);
  }

  @Get('search')
  async searchDocuments(@Query() query: DocumentSearchReqDto) {
    return this.documentsService.searchDocuments(query);
  }
}