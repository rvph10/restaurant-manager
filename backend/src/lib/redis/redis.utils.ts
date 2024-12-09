import crypto from 'crypto';
import { REDIS_KEY_PATTERNS } from '../../constants/cache';

export class RedisKeyBuilder {
  static generateQueryHash(params: object): string {
    return crypto.createHash('sha256').update(JSON.stringify(params)).digest('hex');
  }

  static formatKey(pattern: string, params: Record<string, string>): string {
    let key = pattern;
    Object.entries(params).forEach(([param, value]) => {
      key = key.replace(`{${param}}`, value);
    });
    return key;
  }

  static product = {
    detail: (id: string) => this.formatKey(REDIS_KEY_PATTERNS.PRODUCT.DETAIL, { id }),
    list: (params: object) =>
      this.formatKey(REDIS_KEY_PATTERNS.PRODUCT.LIST, {
        queryHash: this.generateQueryHash(params),
      }),
    exists: (params: object) =>
      this.formatKey(REDIS_KEY_PATTERNS.PRODUCT.EXISTS, {
        queryHash: this.generateQueryHash(params),
      }),
  };

  static category = {
    detail: (id: string) => this.formatKey(REDIS_KEY_PATTERNS.CATEGORY.DETAIL, { id }),
    list: (params: object) =>
      this.formatKey(REDIS_KEY_PATTERNS.CATEGORY.LIST, {
        queryHash: this.generateQueryHash(params),
      }),
    exists: (params: object) =>
      this.formatKey(REDIS_KEY_PATTERNS.CATEGORY.EXISTS, {
        queryHash: this.generateQueryHash(params),
      }),
    tree: () => REDIS_KEY_PATTERNS.CATEGORY.TREE,
  };

  static station = {
    detail: (id: string) => this.formatKey(REDIS_KEY_PATTERNS.STATION.DETAIL, { id }),
    list: (params: object) =>
      this.formatKey(REDIS_KEY_PATTERNS.STATION.LIST, {
        queryHash: this.generateQueryHash(params),
      }),
  };
}
