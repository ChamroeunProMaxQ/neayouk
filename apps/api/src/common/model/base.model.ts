import type { InferAttributes, InferCreationAttributes } from 'sequelize';
import { Model } from 'sequelize-typescript';

export abstract class BaseModel<TModel extends Model> extends Model<
  InferAttributes<TModel>,
  InferCreationAttributes<TModel>
> {
  // base model properties and methods can be defined here
}
