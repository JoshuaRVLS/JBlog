declare module 'multer' {
  import { Request } from 'express';
  
  export interface File {
    fieldname: string;
    originalname: string;
    encoding: string;
    mimetype: string;
    size: number;
    destination?: string;
    filename?: string;
    path?: string;
    buffer?: Buffer;
  }
  
  export interface StorageEngine {
    _handleFile(req: Request, file: File, callback: (error?: Error, info?: Partial<File>) => void): void;
    _removeFile(req: Request, file: File, callback: (error: Error | null) => void): void;
  }
  
  export interface Options {
    dest?: string;
    storage?: StorageEngine;
    fileFilter?: (req: Request, file: File, cb: FileFilterCallback) => void;
    limits?: {
      fieldNameSize?: number;
      fieldSize?: number;
      fields?: number;
      fileSize?: number;
      files?: number;
      parts?: number;
      headerPairs?: number;
    };
  }
  
  export type FileFilterCallback = (error: Error | null, acceptFile?: boolean) => void;
  
  export function memoryStorage(): StorageEngine;
  
  interface MulterInstance {
    single(name: string): (req: Request, res: any, next: any) => void;
    array(name: string, maxCount?: number): (req: Request, res: any, next: any) => void;
    fields(fields: Array<{ name: string; maxCount?: number }>): (req: Request, res: any, next: any) => void;
    none(): (req: Request, res: any, next: any) => void;
    any(): (req: Request, res: any, next: any) => void;
  }
  
  interface MulterConstructor {
    (options?: Options): MulterInstance;
    memoryStorage(): StorageEngine;
  }
  
  const multer: MulterConstructor;
  export default multer;
}

