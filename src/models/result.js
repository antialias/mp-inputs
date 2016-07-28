import { pick } from '../util';

export default class Result {
  constructor(attrs) {
    Object.assign(this, pick(attrs, ['headers', 'series']));
  }
}
