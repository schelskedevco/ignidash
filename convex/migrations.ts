import { Migrations } from '@convex-dev/migrations';

import { components } from './_generated/api';
import { DataModel } from './_generated/dataModel';

export const migrations = new Migrations<DataModel>(components.migrations);

export const run = migrations.runner();
