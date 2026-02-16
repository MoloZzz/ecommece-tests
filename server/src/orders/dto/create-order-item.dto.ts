import { ApiProperty } from "@nestjs/swagger";
import { IsDefined, IsInt, IsUUID } from "class-validator";

export class CreateOrderItemDto {
    @ApiProperty()
    @IsDefined()
    @IsUUID(4)  
    productId: string;
    
    @ApiProperty()
    @IsDefined()
    @IsInt()
    quantity: number;
}