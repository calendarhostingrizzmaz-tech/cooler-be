import { Type } from 'class-transformer';
import { IsInt, ValidateNested } from 'class-validator';

class ReorderItemDto {
  @IsInt()
  id: number;

  @IsInt()
  sortOrder: number;
}

export class ReorderItemsDto {
  @ValidateNested({ each: true })
  @Type(() => ReorderItemDto)
  items: ReorderItemDto[];
}
