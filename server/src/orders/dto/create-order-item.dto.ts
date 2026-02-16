import { ApiProperty } from "@nestjs/swagger";
import { IsDefined, IsInt, IsPositive, IsUUID, Min } from "class-validator";
import { Type } from "class-transformer";

export class CreateOrderItemDto {
    @ApiProperty()
    @IsDefined()
    @IsUUID(4)  
    productId: string;
    
    @ApiProperty()
    @Type(() => Number)
    @IsDefined()
    @IsInt()
    @IsPositive()
    quantity: number;
}