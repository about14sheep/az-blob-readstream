import type { BlobClient, BlobDownloadToBufferOptions } from "@azure/storage-blob";
import { Readable, type ReadableOptions } from "stream";

export type BlobReadstreamParameters = {
  blobClient: BlobClient;
  contentLength: number;
  byteRange?: number;
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
    this.range = byteRange || 64 * 1024;
    this.blobDownloadToBufferOptions = downloadToBufferOptions;
  }
  
  private drainBuffer() {
    while(this.read());
  }
  
  /**
  * Adjust size of byte range to grab in `downloadToBuffer` call
  *
  * @param {number} bytes - Numnber of bytes to set for range
  **/
  adjustByteRange(bytes: number) {
    this.range = bytes;
  }

  /**
  * Drains the internal buffer and
  * moves cursor bytes length back in the file
  *
  * If current position - number of bytes to move back
  * is <= 0, set cursor at beginning of file
  *
  * @param {number} bytes - Number of bytes to subtract from cursor (defaults to range)
  **/
  moveCursorBack(bytes: number = this.range) {
    this.drainBuffer();
    if (this.curr - bytes > 0) {
      this.curr -= bytes;
    } else {
      this.curr = 0;
    }
  }
  
  /**
  * Drains the internal buffer and
  * moves cursor bytes length forward in the file
  *
  * If current cursor position + number of bytes to move forward
  * is greater than the length of the file, set cursor at end of file
  *
  * @param {number} bytes - Number of bytes to add to the cursor (defaults to range)
  **/
  moveCursorForward(bytes: number = this.range) {
    this.drainBuffer();
    if (this.curr + bytes <= this.contentLength) {
      this.curr += bytes;
    } else {
      this.curr += this.contentLength + 1;
    }
  }

  async _read(): Promise<void> {
    if (this.curr >= this.contentLength) {
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

        this.curr += buff.byteLength;
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
