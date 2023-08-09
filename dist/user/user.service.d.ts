import { Model } from 'mongoose';
import { UserDocument } from './user.schema';
import { UserDetails } from './user-details.interface';
export declare class UserService {
    private readonly userModel;
    constructor(userModel: Model<UserDocument>);
    _getUserDetails(user: UserDocument): UserDetails;
    findByEmail(email: string): Promise<UserDocument | null>;
    findById(id: string): Promise<UserDetails | null>;
    create(name: string, email: string, hashedPassword: string): Promise<UserDocument>;
}
