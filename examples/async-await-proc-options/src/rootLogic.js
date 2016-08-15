import { logic as userLogic } from './user/index';
import { logic as usersLogic } from './users/index';

export default [
  ...userLogic,
  ...usersLogic
];
