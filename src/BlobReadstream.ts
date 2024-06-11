import type { BlobClient, BlobDownloadToBufferOptions } from "@azure/storage-blob";
import { Readable, type ReadableOptions } from "stream";

export class BlobReadstream extends Readable {
  blobClient: BlobClient;
  blobDownloadToBufferOptions: BlobDownloadToBufferOptions | undefined;
  curr: number = 0;

  constructor(
    blobClient: BlobClient,
    downloadToBufferOptions?: BlobDownloadToBufferOptions,
    nodeReadableOptions?: ReadableOptions
  ) {
    super(nodeReadableOptions);
    this.blobClient = blobClient;
    this.blobDownloadToBufferOptions = downloadToBufferOptions;
  
  }

  async _read(size: number): Promise<void> {
    try {
      const buff = Buffer.alloc(size);
      await this.blobClient.downloadToBuffer(
        buff,
        this.curr,
        size,
        this.blobDownloadToBufferOptions
      );

      this.curr += buff.byteLength;
      this.push(buff);
    } catch (error: unknown) {
        this.destroy(error as Error);
    }
  }
}
