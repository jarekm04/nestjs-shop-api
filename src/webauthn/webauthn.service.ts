import { HttpException, HttpStatus, Injectable, UnauthorizedException } from "@nestjs/common";
import { AuthenticationResponseJSON, RegistrationResponseJSON } from "@simplewebauthn/typescript-types";
import * as SimpleWebAuthnServer from "@simplewebauthn/server";
import { UserService } from "src/user/user.service";

const rpID = "localhost";
const protocol = "http";
const port = 5173;
const expectedOrigin = `${protocol}://${rpID}:${port}`;

@Injectable()
export class WebAuthnService {
  constructor(private userService: UserService) {}

  async checkOptions(email: string) {
    const user = await this.userService.findByEmail(email);
    if (user) {
      return user;
    } else {
      throw new HttpException("An account doesn't exist!", HttpStatus.NOT_FOUND);
    }
  }

  async generateLoginOptions(email: string) {
    const user = await this.userService.findByEmail(email);

    const options = {
      timeout: 60000,
      allowCredentials: [],
      devices:
        user && user.devices
          ? user.devices.map((dev) => ({
              id: dev.credentialID,
              type: "public-key",
              transports: dev.transports,
            }))
          : [],
      userVerification: "required" as UserVerificationRequirement,
      rpID,
    };
    const loginOpts = SimpleWebAuthnServer.generateAuthenticationOptions(options);

    if (user) user.currentChallenge = loginOpts.challenge;
    this.userService.updateUser(user);

    return loginOpts;
  }

  async verifyLogin(email: string, data: AuthenticationResponseJSON) {
    const user = await this.userService.findByEmail(email);

    if (user == null) {
      return { ok: false };
    }

    const expectedChallenge = user.currentChallenge;

    let dbAuthenticator;
    const b64 = Buffer.from(data.rawId, "base64");
    const rawID = new Uint8Array(b64);
    const rawIDString = rawID.toString();

    for (const dev of user.devices) {
      const credID = dev.credentialID; // Binary.createFromBase64("so-its=type", 0),
      const buffer = credID.read(0, credID.length());
      const uint8Array = new Uint8Array(buffer);
      const uint8ArrayToString = uint8Array.toString();

      if (rawIDString === uint8ArrayToString) {
        dbAuthenticator = dev;
        break;
      }
    }

    if (!dbAuthenticator || dbAuthenticator === undefined) {
      throw new UnauthorizedException("Wrong Credentials");
      // return { ok: false, message: "Authenticator is not registered with this site" };
    }

    let verification;
    try {
      const credentialPublicKey = dbAuthenticator.credentialPublicKey;
      const buffer = credentialPublicKey.read(0, credentialPublicKey.length());
      const options = {
        credential: data,
        expectedChallenge: `${expectedChallenge}`,
        expectedOrigin,
        expectedRPID: rpID,
        authenticator: {
          ...dbAuthenticator,
          credentialPublicKey: buffer,
        },
        requireUserVerification: true,
        response: data,
      };
      verification = await SimpleWebAuthnServer.verifyAuthenticationResponse(options);
    } catch (error) {
      return { ok: false, message: error.toString() };
    }

    const { verified, authenticationInfo } = verification;

    if (verified) {
      dbAuthenticator.counter = authenticationInfo.newCounter;
    }

    return {
      ok: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    };
  }

  async generateRegistrationOptions(email: string) {
    const user = await this.userService.findByEmail(email);

    const options = {
      rpName: "Shop Square",
      rpID,
      userID: user.email,
      userName: user.name,
      timeout: 60000,
      attestationType: "none" as AttestationConveyancePreference,
      excludeCredentials: user.devices
        ? user.devices.map((dev) => ({
            id: dev.credentialID,
            type: "public-key" as PublicKeyCredentialType,
            transports: dev.transports,
          }))
        : [],
      authenticatorSelection: {
        userVerification: "required",
        residentKey: "required",
      } as AuthenticatorSelectionCriteria,
      supportedAlgorithmIDs: [-7, -257],
    };

    const regOptions = SimpleWebAuthnServer.generateRegistrationOptions(options);
    user.currentChallenge = regOptions.challenge;

    this.userService.updateUser(user);

    return regOptions;
  }

  async verifyRegistration(email: string, data: RegistrationResponseJSON) {
    const user = await this.userService.findByEmail(email);

    const expectedChallenge = user.currentChallenge;

    let verification;
    try {
      const options = {
        credential: data,
        expectedChallenge: `${expectedChallenge}`,
        expectedOrigin,
        expectedRPID: rpID,
        requireUserVerification: true,
        response: data,
      };
      verification = await SimpleWebAuthnServer.verifyRegistrationResponse(options);
    } catch (error) {
      console.error(error);
      return { error: error.toString() };
    }

    const { verified, registrationInfo } = verification;

    if (verified && registrationInfo) {
      const { credentialPublicKey, credentialID, counter } = registrationInfo;

      const existingDevice = user.devices
        ? user.devices.find((device) => {
            const b64 = Buffer.from(device.credentialID, "base64");
            const uint8ArrayData = new Uint8Array(b64);
            const devicesIDString = uint8ArrayData.toString();
            const credentialIDString = credentialID.toString();
            return devicesIDString === credentialIDString;
          })
        : false;

      if (!existingDevice) {
        const newDevice = {
          credentialPublicKey,
          credentialID,
          counter,
          transports: data.response.transports,
        };
        if (user.devices == undefined) {
          user.devices = [];
        }
        user.webauthn = true;
        user.devices.push(newDevice);
        this.userService.updateUser(user);
      } else {
        return { ok: false, message: "Device already exists" };
      }
    }

    return { ok: true };
  }
}
