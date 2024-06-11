export class BlobReadstreamError extends Error {
  BlobClientError: unknown;
  constructor(message: string, blobClientError: unknown) {
    super(message);
    this.BlobClientError = blobClientError;
  }
}
