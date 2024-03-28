declare var self: Worker;

self.onmessage = (event) => {
    const db = event.data as DoubleBuffer;
    sleepUntilReadyToRead(db)

    // copy data out of the read buffer
    const data = new Uint8Array(db.byteLength * Uint8Array.BYTES_PER_ELEMENT)
    copyFromReadBuffer(db, data)

    // mark writable
    markReadyToWrite(db)

    postMessage(data)
};
