export interface JwtPayload {
  id: string | number;
  email: string;
  createdAt?: Date;
  updatedAt?: Date;
}
