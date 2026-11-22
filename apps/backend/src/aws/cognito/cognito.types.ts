import { UserType } from '../../entities/user.entity';

// Resolved Cognito configuration derived from environment variables.
export interface CognitoConfig {
  region: string; // AWS region (ex: us-east-1)
  userPoolId: string; // Cognito user pool ID
  clientId: string; // Cognito app client ID
  issuer: string; // Token issuer URL (ex: https://cognito-idp.<region>.amazonaws.com/<userPoolId>)
}

// We only use access tokens to verify the user's identity and allow access to protected resources.
// Cognito access token: https://docs.aws.amazon.com/cognito/latest/developerguide/amazon-cognito-user-pools-using-the-access-token.html
export interface AccessTokenPayload {
  sub: string; // Subject (unique identifier for the user)
  'cognito:groups'?: string[]; // Groups (ex: ['admin', 'user'])
  iss: string; // Issuer (ex: https://cognito-idp.<Region>.amazonaws.com/<your user pool ID>)
  token_use: 'access'; // Token use (ID or access token from Cognito)
  client_id: string; // Client ID used during authentication (ex: <your client ID>)
  exp: number; // Expiration time (Unix timestamp)
  iat: number; // Issued at time (Unix timestamp)
}

// Role assigned to a Cognito account. Same values as the `users.type` column.
export type CognitoRole = UserType;

// Cognito group name for each role. The groups live in the user pool already.
export const COGNITO_GROUPS: Record<CognitoRole, string> = {
  [UserType.ADMIN]: 'admins',
  [UserType.STEWARD]: 'stewards',
};

// What createUser returns for the account it created.
export interface CognitoUserResult {
  username: string; // Cognito username (the lowercased email)
  sub?: string; // Cognito subject (unique id), when Cognito returns one
  email: string;
  role: CognitoRole;
  enabled: boolean;
}
