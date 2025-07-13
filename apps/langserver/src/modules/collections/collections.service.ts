import { BadRequestException, HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { supabase } from 'src/common/supabae_client';
import { v4 as uuidv4 } from "uuid";
import { CollectionRes } from './types';

@Injectable()
export class CollectionsService {
  userId: string = "default";
  // constructor(userId: string) {
  //   this.userId = userId;
  // }

  async list(): Promise<CollectionRes[]> {
    const { data, error } = await supabase
      .from('rag_collections')
      .select('id, name, metadata')
      .eq('metadata->>user_id', this.userId)
      .order('metadata->>name', { ascending: true });

    if (error) throw error;
  
    return (data ?? []).map((r: any) => {
      const metadata = r.metadata;
      const name = r.name || 'Unnamed';
      delete metadata.name;
      return {
        id: r.id,
        name,
        metadata,
      };
    });
  }

  async get(collectionId: string): Promise<CollectionRes | null> {
    const { data, error } = await supabase
      .from('rag_collections')
      .select('id, name, metadata')
      .eq('id', collectionId)
      .eq('metadata->>user_id', this.userId)
      .single();

    if (error) return null;

    return {
      id: data.id,
      name: data.name,
      metadata: data.metadata,
    }; 
  }

  async create(collectionName: string, metadata: Record<string, any>): Promise<CollectionRes | null> {
    metadata.user_id = this.userId;

    // 检查 name 是否已存在（同一用户下）
    const { data: existingData, error: checkError } = await supabase
    .from('rag_collections')
    .select('name')
    .eq('name', collectionName)
    .single();

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 是 "not found" 错误
      throw checkError;
    }

  if (existingData) {
    throw new HttpException({
      status: HttpStatus.CONFLICT,
      message: `Collection with name "${collectionName}" already exists.`,
    }, HttpStatus.CONFLICT);
  }

    // 插入新集合
    const { data, error } = await supabase
      .from('rag_collections')
      .insert([{ id: uuidv4(), name: collectionName, metadata: metadata }])
      .select('id, name, metadata')
      .single();
    if (error) return null;

    return {
      id: data.id,
      name: data.name,
      metadata: data.metadata,
    };
  }

  async update(
    collectionId: string,
    { name, metadata }: { name?: string; metadata?: Record<string, any> }
  ): Promise<CollectionRes | null> {
    if (!name && !metadata) throw new Error('Must update at least 1 attribute.');

    // let merged: Record<string, any> = {};
    // if (metadata) {
    //   merged = { ...metadata, user_id: this.userId };
    //   if (name) merged.name = name;
    //   else {
    //     const existing = await this.get(collectionId);
    //     if (!existing) throw new Error('Collection not found or not owned by you.');
    //     merged.name = existing.name;
    //   }
    // }
    const existing = await this.get(collectionId);
    if (!existing) throw new Error('Collection not found or not owned by you.');

    // 如果要更新 name，检查新 name 是否已存在（排除当前记录）
    if (name && name !== existing.name) {
      const { data: nameExists, error: checkError } = await supabase
        .from('rag_collections')
        .select('name')
        .eq('name', name)
        .neq('id', collectionId) // 排除当前记录
        .single();

      if (checkError && checkError.code !== 'PGRST116') { // PGRST116 是 "not found" 错误
        throw checkError;
      }

      if (nameExists) {
        throw new HttpException({
          status: HttpStatus.CONFLICT,
          error: `Collection with name "${name}" already exists.`,
        }, HttpStatus.CONFLICT);
      }
    }

    const updateData: Record<string, any> = {};
    if (metadata) updateData.metadata = { ...existing.metadata, ...metadata };
    if (name) updateData.name = name;

    const { data, error } = await supabase
      .from('rag_collections')
      .update(updateData)
      .eq('id', collectionId)
      .eq('metadata->>user_id', this.userId)
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      name: data.name,
      metadata: data.metadata,
    };
  }

  async delete(ids: string[]): Promise<number> {
    const { data, error } = await supabase
      .from('rag_collections')
      .delete()
      .in('id', ids)
      .select()

    if (error) throw error;
    return data.length ?? 0;
  }
}
