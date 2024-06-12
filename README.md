# az-blob-readstream
Azure Blob Storage Read Stream made easy

Simple wrapper around [Azure BlobClient `downloadToBuffer` method](https://learn.microsoft.com/en-us/javascript/api/@azure/storage-blob/blobclient?view=azure-node-latest#@azure-storage-blob-blobclient-downloadtobuffer-1) allowing intuitive and stable streaming.
  * ZERO Dependencies
  * Simple interface for streaming any size file from an Azure Blob Storage container
  * Easily change speed and move cursor forward/backwards in the file
  * All of the functionality you love with NodeJS Readable streams
  * Handles unresolved issue [Download from Blob storage gets stuck sometimes and never completes](https://github.com/Azure/azure-sdk-for-js/issues/22321)

## Installing the package
To install the package:
```
npm install az-blob-readstream
```

## Using the package
You can integrate the `BlobReadstream` class with the [`@azure/storage-blob`](https://www.npmjs.com/package/@azure/storage-blob) package easily:
```js
import { BlobServiceClient } from "@azure/storage-blob";
import { BlobReadstream } from "az-blob-readstream";

const CONNECTION_STRING = "<your blob storage connection string>";

// Setup the connection to blob storage, the container, and the blob
const serviceClient = BlobServiceClient.fromConnectionString(CONNECTION_STRING);
const containerClient = serviceClient.getContainerClient("<container name>");
const blobClient = containerClient.getBlobClient("<blob name>");

// Get metadata properties so we know the size of the file
const metadata = await blobClient.getProperties();

// Create BlobReadstream object instead of calling the blob clients download method.
const parameters = {
 blobClient, // Pass in the blobClient
 contentLength: metadata.contentLength, // The length of the file being read
 byteRange: 1024 * 1024 // Amount of bytes in each chunk (optional - defaults to 64 KiB)
}
const stream = new BlobReadstream(parameters);
```

### Configuring Azure Blob Storage `BlobDownloadToBufferOptions`
The `downloadToBufferOptions` parameter allows you to pass in any [`BlobDownloadToBufferOptions`](https://learn.microsoft.com/en-us/javascript/api/%40azure/storage-blob/blobdownloadtobufferoptions?view=azure-node-latest) to the Azure Blob Storage `downloadToBuffer` method.
```js
const parameters = {
 blobClient,
 contentLength,
 byteRange,
 downloadToBufferOptions: {
  maxRetryRequestPerBlock: 10
 }
};

const stream = new BlobReadstream(parameters);
```
Just like in the `@azure/storage-blob` sdk, omitting this perameter will default all values in `BlobDownloadToBufferOptions`.

### Adjusting the read stream
To adjust the range of bytes grabbed from Azure Blob Storage:
```js
// You can adjust the range at any point during the stream (adjusting the speed)
stream.adjustByteRange(1024 * 1024 * 5); // 5 MiB
```
To adjust cursor position:
```js
// You can move the cursor forwards to skip ahead (or back) in the file
// By default, the stream will skip ahead by the current Range
stream.moveCursorForward();
stream.moveCursorBack();

// Both of these methods also take in a `bytes` parameter for finer control
stream.moveCursorForward(10 * 1024); // Move cursor forward 10 KiB in file
stream.moveCursorBack(5 * 1024); // Move cursor back 5 KiB in file
```

### Inherited features from NodeJS Readable class
You can alse use this `BlobReadstream` like any other [NodeJS Readable stream](https://nodejs.org/api/stream.html#readable-streams), setting an event listener is exactly the same:
```js
stream.on('data', (chunk) => {
  console.log(`read: ${chunk.toString()}`);
});
stream.on('end', () => {
  console.log('end');
});
```
To work with zipped files:
```js
import { createGunzip } from 'zlib';

const gzip = createGunzip();
// pipe into gzip to unzip files as you stream!
stream.pipe(gzip);
```
## API
### `BlobReadstream(parameters: BlobReadstreamParameters)`
Instantiates a new `BlobReadstream` object.

Parameters:
* `parameters` (BlobReadstreamParameters) - Container object to hold parameters
  * `parameters.blobClient` ([BlobClient](https://learn.microsoft.com/en-us/javascript/api/@azure/storage-blob/blobclient?view=azure-node-latest)) - Azure Blob Storage Blob Client
  * `parameters.contantLength` (number) - Size of file to download
  * `parameters.byteRange` (number) - (optional) Range of bytes to grab in each `downloadToBuffer` call (defaults to 64 KiB)
  * `parameters.downloadToBufferOptions` ([BlobDownloadToBufferOptions](https://learn.microsoft.com/en-us/javascript/api/%40azure/storage-blob/blobdownloadtobufferoptions?view=azure-node-latest)) - (optional) Options to pass to `downloadToBuffer` call
* `nodeReadableStreamOptions` ([ReadableOptions](https://nodejs.org/api/stream.html#new-streamreadableoptions)) - (optional) NodeJs Readable options to pass to super call
### `adjustByteRange(bytes: number)`
Adjusts the `BlobReadstream.range` property. Can be used to slow down or speed up the stream by grabbing a smaller or larger range of bytes.

Parameter:
* `bytes` (number) - New range of bytes to set
### `moveCursorForward(bytes: number)`
Drains the internal buffer and adjusts the `BlobReadstream.curr` property moving the cursor forward `bytes` amount.
If current cursor position + number of bytes to move forward is > the length of the file, set cursor at end of file 

Parameter:
* `bytes` (number) - (optional) Number of bytes to move forward (defaults to current range)
### `moveCursorBack(bytes: number)`
Drains the internal buffer and adjusts the `BlobReadstream.curr` property moving the cursor back `bytes` amount.
If current cursor position - number of bytes to move back is <= 0, set cursor at begining of file

Parameter:
* `bytes` (number) - (optional) Number of bytes to move forward (defaults to current range)
