export interface UserTokenAttribute {
  id: number;
  token: string;
  tokenType: string;
  expDate: Date;
  status: string;
  userId: number;
}

export interface CreateUserTokenDto extends Omit<UserTokenAttribute, "id"> {}
