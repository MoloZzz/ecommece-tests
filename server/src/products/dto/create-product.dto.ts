import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsDefined, IsNotEmpty, IsNumber, IsString } from "class-validator";

export class CreateProductDto {
    @ApiProperty()
    @IsDefined()
    @IsNotEmpty()
    @IsString()
    name: string;
    @ApiProperty()
    @IsDefined()
    @Type(() => Number)
    @IsNumber()
    price: number;
    @ApiProperty()
    @IsDefined()
    @Type(() => Number)
    @IsNumber()
    stock: number;
}
