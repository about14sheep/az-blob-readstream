import type { BlobClient, BlobDownloadToBufferOptions } from "@azure/storage-blob";
import { Readable, type ReadableOptions } from "stream";

export type BlobReadstreamParameters = {
  blobClient: BlobClient;
  contentLength: number;
  byteRange: number;
  downloadToBufferOptions?: BlobDownloadToBufferOptions;
}

export class BlobReadstream extends Readable {
  private blobClient: BlobClient;
  private blobDownloadToBufferOptions: BlobDownloadToBufferOptions | undefined;
  private curr: number = 0;
  private contentLength: number;
  private range: number;

  constructor(
    blobReadstreamParameters: BlobReadstreamParameters,
    nodeReadableOptions?: ReadableOptions
  ) {
    super(nodeReadableOptions);
    const {
      blobClient,
      contentLength,
      byteRange,
      downloadToBufferOptions
    } = blobReadstreamParameters;

    this.blobClient = blobClient;
    this.contentLength = contentLength;
    this.range = byteRange;
    this.blobDownloadToBufferOptions = downloadToBufferOptions;
  }

  async _read(): Promise<void> {
    if (this.curr > this.contentLength) {
      this.push(null);
    } else {
      try {
        const requestRange = this.getRequestRange();
        const buff = Buffer.alloc(requestRange);
        await this.blobClient.downloadToBuffer(
          buff,
          this.curr,
          requestRange,
          this.blobDownloadToBufferOptions
        );

        this.curr += requestRange + 1;
        this.push(buff);
      } catch (error: unknown) {
        this.destroy(error as Error);
      }
    }
  }

  getRequestRange() {
    if (this.curr + this.range > this.contentLength) {
      return this.contentLength - this.curr;
    }

    return this.range;
  }
}
