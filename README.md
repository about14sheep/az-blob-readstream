# az-blob-readstream
Azure Blob Storage Read Stream made easy

Simple wrapper around [Azure BlobClient `downloadToBuffer` method](https://learn.microsoft.com/en-us/javascript/api/@azure/storage-blob/blobclient?view=azure-node-latest#@azure-storage-blob-blobclient-downloadtobuffer-1) allowing intuitive and stable streaming.
  * ZERO Dependencies
  * Simple interface for streaming any size file from an Azure Blob Storage container
  * Automatically retry failed file chunks
  * All of the functionality you love with NodeJS Readable streams
  * Handles unresolved issue [Download from Blob storage gets stuck sometimes and never completes](https://github.com/Azure/azure-sdk-for-js/issues/22321)

## Installing the package
To install the package:
```
npm install az-blob-readstream
```

## Using the package
You can integrate the `BlobReadstream` class with the [`@azure/storage-blob`](https://www.npmjs.com/package/@azure/storage-blob) package easily:
