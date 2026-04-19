import {
  ArrayMaxSize,
  IsArray,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateIf,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';

/** Multipart / JSON body: array, or JSON string like ["https://..."] */
export function parseImageUrlsField(value: unknown): string[] | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  if (Array.isArray(value)) {
    return value.filter((v): v is string => typeof v === 'string' && v.trim() !== '');
  }
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value) as unknown;
      if (!Array.isArray(parsed)) return undefined;
      return parsed.filter((v): v is string => typeof v === 'string' && v.trim() !== '');
    } catch {
      return undefined;
    }
  }
  return undefined;
}

export class CreateItemDto {
  @ApiProperty({ example: 'Classic T-Shirt' })
  @IsString()
  name: string;

  @ApiProperty({ example: 19.99 })
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  price: number;

  @ApiPropertyOptional({
    example: 14.99,
    description: 'Optional sale price; must be less than price. Omit or clear to show only regular price.',
  })
  @Transform(({ value }) => {
    if (value === '' || value === undefined) return undefined;
    if (value === null) return null;
    const n = Number(value);
    return Number.isFinite(n) ? n : undefined;
  })
  @IsOptional()
  @ValidateIf((_, v) => v !== null && v !== undefined)
  @IsNumber()
  @Min(0)
  discountedPrice?: number | null;

  @ApiProperty({ example: 'https://example.com/image.jpg' })
  @IsString()
  @IsOptional()
  image: string;

  @ApiPropertyOptional({
    description:
      'Ordered gallery URLs (JSON array or stringified JSON). New uploads append after these when using multipart `files`.',
    example: ['https://example.com/a.jpg', 'https://example.com/b.jpg'],
  })
  @IsOptional()
  @Transform(({ value }) => parseImageUrlsField(value))
  @ValidateIf((_, v) => v !== undefined && v !== null)
  @IsArray()
  @ArrayMaxSize(5, { message: 'At most 5 image URLs per product' })
  @IsString({ each: true })
  imageUrls?: string[];

  @ApiProperty({ example: 'A comfortable everyday T-shirt' })
  @IsString()
  description: string;

  @ApiProperty({ example: 1, required: false })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  categoryId?: number;
}
