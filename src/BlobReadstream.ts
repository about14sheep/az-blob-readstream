import type { BlobClient } from "@azure/storage-blob";
import { Readable, type ReadableOptions } from "stream";
import { BlobReadstreamError } from "./BlobReadstreamError";

export type BlobReadstreamOptions = {
  retry?: number;
}

export class BlobReadstream extends Readable {
  blobClient: BlobClient;
  curr: number = 0;
  retry: number = 3;

  constructor(
    blobClient: BlobClient,
    options?: BlobReadstreamOptions,
    nodeReadableOptions?: ReadableOptions
  ) {
    super(nodeReadableOptions);
    this.blobClient = blobClient;

    if (options) {
      const { retry = 3 } = options;
      this.retry = retry;
    }
  }

  async _read(size: number): Promise<void> {
    try {
      const buff = Buffer.alloc(size);
      await this.blobClient.downloadToBuffer(buff, this.curr, size);

      this.curr += buff.byteLength;
      this.push(buff);
    } catch (error: unknown) {
      if (this.retry > 0) {
        this.retry--;
      } else {
        this.destroy(
          new BlobReadstreamError("Max retries reached", error)
        );
      }
    }
  }
}
