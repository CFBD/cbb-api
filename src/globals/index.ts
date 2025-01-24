export class AuthorizationError extends Error {}

export interface ApiUser {
  id: number;
  username: string;
  patronLevel: number;
  remainingCalls: number;
  isAdmin: boolean;
}

export class UserMessageError extends Error {
  message: string;

  constructor(message: string) {
    super(message);
    this.message = message;
  }
}
