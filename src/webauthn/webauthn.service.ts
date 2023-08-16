import { Injectable } from "@nestjs/common";
import { UserService } from "src/user/user.service";

@Injectable()
export class WebAuthnService {
  constructor(
    // private webauthnService
    private userService: UserService
  ) {}

  async checkOptions(email: string) {
    const user = await this.userService.findByEmail(email);
    return user;
  }
}
