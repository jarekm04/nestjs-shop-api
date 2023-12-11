import { Body, Controller, Post } from "@nestjs/common";
import { WebAuthnService } from "./webauthn.service";
import { UserDocument } from "src/user/user.schema";
import { AuthenticationResponseJSON, RegistrationResponseJSON } from "@simplewebauthn/typescript-types";

@Controller("webauthn")
export class WebAuthnController {
  constructor(private webAuthnService: WebAuthnService) {}

  @Post("auth-options")
  async checkOptions(@Body() body: { email: string }) {
    const { email } = body;
    return this.webAuthnService.checkOptions(email);
  }

  @Post("login-options")
  async loginOptions(@Body() body: { email: string }) {
    return this.webAuthnService.generateLoginOptions(body.email);
  }

  @Post("login-verification")
  async loginVerification(@Body() body: { email: string; data: AuthenticationResponseJSON }) {
    return this.webAuthnService.verifyLogin(body.email, body.data);
  }

  @Post("registration-options")
  async registrationOptions(@Body() body: { email: string }) {
    return this.webAuthnService.generateRegistrationOptions(body.email);
  }

  @Post("registration-verification")
  async registrationVerification(
    @Body() body: { user: UserDocument; data: RegistrationResponseJSON }
  ) {
    return this.webAuthnService.verifyRegistration(body.user.email, body.data);
  }
}
