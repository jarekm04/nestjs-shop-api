import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { ProductModule } from "./product/product.module";
import { UserModule } from "./user/user.module";
import { AuthModule } from "./auth/auth.module";
import { ConfigModule } from "@nestjs/config";
import { WebAuthnModule } from "./webauthn/webauthn.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    MongooseModule.forRoot("mongodb://localhost:27017/shop"),
    ProductModule,
    UserModule,
    AuthModule,
    WebAuthnModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
