import { Module } from "@nestjs/common";
import { UserModule } from "src/user/user.module";
import { WebAuthnController } from "./webauthn.controller";
import { WebAuthnService } from "./webauthn.service";

@Module({
  imports: [UserModule],
  controllers: [WebAuthnController],
  providers: [WebAuthnService],
})
export class WebAuthnModule {}
