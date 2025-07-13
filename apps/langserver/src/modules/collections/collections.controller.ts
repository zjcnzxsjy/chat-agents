import { Controller, Get, Param, Post, Body, Delete, Query, Patch } from '@nestjs/common';
import { CollectionRes } from './types';
import { CollectionsService } from './collections.service';
import { CollectionsDeteleReqDto, CollectionsReqBodyDto, CollectionsReqParamsDto } from './dtos/collections-req.dto';

@Controller('collections')
export class CollectionsController {
  constructor(private readonly collectionsService: CollectionsService) {}
  @Get()
  async getCollections(): Promise<CollectionRes[]> {
    return this.collectionsService.list();
  }

  @Get(':collectionId')
  async getCollection(@Param() params: CollectionsReqParamsDto): Promise<CollectionRes | null> {
    return this.collectionsService.get(params.collectionId);
  }

  @Post()
  async createCollection(@Body() body: CollectionsReqBodyDto) {
    const { name, metadata } = body;
    return this.collectionsService.create(name, metadata);
  }

  @Patch()
  async updateCollection(@Query() query: CollectionsReqParamsDto, @Body() body: CollectionsReqBodyDto) {
    return this.collectionsService.update(query.collectionId, body);
  }

  @Delete()
  async deleteCollection(@Query() query: CollectionsDeteleReqDto) {
    return this.collectionsService.delete(query.ids);
  }
}
