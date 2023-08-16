import { Body, Controller, Post } from "@nestjs/common";
import { WebAuthnService } from "./webauthn.service";

@Controller("webauthn")
export class WebAuthnController {
  constructor(private webAuthnService: WebAuthnService) {}

  @Post("auth-options")
  checkOptions(@Body() options: { email: string }) {
    const { email } = options;
    return this.webAuthnService.checkOptions(email);
  }
}
