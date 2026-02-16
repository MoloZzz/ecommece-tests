import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsDefined, IsString, IsUUID } from "class-validator";

export class IdParamDto {
  @ApiProperty({
      name: "id",
      description: "The ID of the resource"
  })
    @IsDefined()
    @IsUUID()
    @IsString()
    @Type(() => String)
    id: string;
}