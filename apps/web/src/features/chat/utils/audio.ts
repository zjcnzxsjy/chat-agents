export function createWavBlob(base64Audio: string) {
  // Decode Base64 to ArrayBuffer
  const binaryString = window.atob(base64Audio);
  const len = binaryString.length;
  const pcmData = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
      pcmData[i] = binaryString.charCodeAt(i);
  }

  const sampleRate = 24000;
  const numChannels = 1; // LINEAR16 is mono
  const bitsPerSample = 16;
  const dataSize = pcmData.length;

  // Create a 44-byte buffer for the WAV header
  const header = new ArrayBuffer(44);
  const view = new DataView(header);

  // RIFF chunk descriptor
  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true); // ChunkSize
  writeString(view, 8, 'WAVE');
  // "fmt " sub-chunk
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true); // Subchunk1Size (16 for PCM)
  view.setUint16(20, 1, true); // AudioFormat (1 for PCM)
  view.setUint16(22, numChannels, true); // NumChannels
  view.setUint32(24, sampleRate, true); // SampleRate
  view.setUint32(28, sampleRate * numChannels * (bitsPerSample / 8), true); // ByteRate
  view.setUint16(32, numChannels * (bitsPerSample / 8), true); // BlockAlign
  view.setUint16(34, bitsPerSample, true); // BitsPerSample
  // "data" sub-chunk
  writeString(view, 36, 'data');
  view.setUint32(40, dataSize, true); // Subchunk2Size

  // Combine header and PCM data into a single Blob
  const wavBlob = new Blob([header, pcmData], { type: 'audio/wav' });
  return wavBlob;
}

function writeString(view: DataView, offset: number, string: string) {
  for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
  }
}