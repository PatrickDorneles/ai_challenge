import { Injectable } from "@nestjs/common";

@Injectable()
export class ConfigService {
  get<T>(key: string, transformFn?: (value: string) => T): T {
    const value = process.env[key];

    if (value === undefined) {
      throw new Error(`Config key ${key} is not defined`);
    }

    return transformFn ? transformFn(value) : (value as unknown as T);
  }
}
