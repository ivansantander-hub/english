export class InvalidCredentialsError extends Error {
  constructor() {
    super("Incorrect email or PIN.");
    this.name = "InvalidCredentialsError";
  }
}

export class AccountLockedError extends Error {
  constructor(readonly lockedUntil: Date) {
    super("Too many failed attempts. Try again in a few minutes.");
    this.name = "AccountLockedError";
  }
}

export class EmailAlreadyRegisteredError extends Error {
  constructor() {
    super("An account with this email already exists.");
    this.name = "EmailAlreadyRegisteredError";
  }
}

export class InvalidPinFormatError extends Error {
  constructor() {
    super("PIN must be exactly 6 digits.");
    this.name = "InvalidPinFormatError";
  }
}
