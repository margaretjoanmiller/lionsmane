import * as authSchema from './auth';
import * as coreSchema from './core';

export const schema = { ...authSchema, ...coreSchema };
