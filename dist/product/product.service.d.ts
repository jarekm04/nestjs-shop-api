import { Model } from 'mongoose';
import { ProductDocument } from './product.schema';
export declare class ProductService {
    private readonly productModel;
    constructor(productModel: Model<ProductDocument>);
    create(name: string, price: number, description: string): Promise<ProductDocument>;
    findAll(): Promise<ProductDocument[]>;
    findOne(id: string): Promise<ProductDocument>;
    update(id: string, newName: string, newPrice: number, newDescription: string): Promise<ProductDocument>;
    delete(id: string): Promise<import("mongodb").DeleteResult>;
}
