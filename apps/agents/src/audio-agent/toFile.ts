export interface BlobPropertyBag {
  endings?: EndingType;
  type?: string;
}

/**
 * A copy of the builtin `FilePropertyBag` type as it isn't fully supported in certain
 * environments and attempting to reference the global version will error.
 *
 * https://github.com/microsoft/TypeScript/blob/49ad1a3917a0ea57f5ff248159256e12bb1cb705/src/lib/dom.generated.d.ts#L503
 * https://developer.mozilla.org/en-US/docs/Web/API/File/File#options
 */
export interface FilePropertyBag extends BlobPropertyBag {
  lastModified?: number;
}

export type BlobPart = string | ArrayBuffer | ArrayBufferView | Blob | DataView;
type BlobLikePart = string | ArrayBuffer | ArrayBufferView | BlobLike | DataView;

/**
 * Intended to match DOM Blob, node-fetch Blob, node:buffer Blob, etc.
 * Don't add arrayBuffer here, node-fetch doesn't have it
 */
interface BlobLike {
  /** [MDN Reference](https://developer.mozilla.org/docs/Web/API/Blob/size) */
  readonly size: number;
  /** [MDN Reference](https://developer.mozilla.org/docs/Web/API/Blob/type) */
  readonly type: string;
  /** [MDN Reference](https://developer.mozilla.org/docs/Web/API/Blob/text) */
  text(): Promise<string>;
  /** [MDN Reference](https://developer.mozilla.org/docs/Web/API/Blob/slice) */
  slice(start?: number, end?: number): BlobLike;
}

export const isAsyncIterable = (value: any): value is AsyncIterable<any> =>
  value != null && typeof value === 'object' && typeof value[Symbol.asyncIterator] === 'function';

/**
 * This check adds the arrayBuffer() method type because it is available and used at runtime
 */
const isBlobLike = (value: any): value is BlobLike & { arrayBuffer(): Promise<ArrayBuffer> } =>
  value != null &&
  typeof value === 'object' &&
  typeof value.size === 'number' &&
  typeof value.type === 'string' &&
  typeof value.text === 'function' &&
  typeof value.slice === 'function' &&
  typeof value.arrayBuffer === 'function';

/**
 * Intended to match DOM File, node:buffer File, undici File, etc.
 */
interface FileLike extends BlobLike {
  /** [MDN Reference](https://developer.mozilla.org/docs/Web/API/File/lastModified) */
  readonly lastModified: number;
  /** [MDN Reference](https://developer.mozilla.org/docs/Web/API/File/name) */
  readonly name?: string | undefined;
}

/**
 * Construct a `File` instance. This is used to ensure a helpful error is thrown
 * for environments that don't define a global `File` yet.
 */
export function makeFile(
  fileBits: BlobPart[],
  fileName: string | undefined,
  options?: FilePropertyBag,
): File {
  checkFileSupport();
  return new File(fileBits as any, fileName ?? 'unknown_file', options);
}

/**
 * This check adds the arrayBuffer() method type because it is available and used at runtime
 */
const isFileLike = (value: any): value is FileLike & { arrayBuffer(): Promise<ArrayBuffer> } =>
  value != null &&
  typeof value === 'object' &&
  typeof value.name === 'string' &&
  typeof value.lastModified === 'number' &&
  isBlobLike(value);

/**
 * Intended to match DOM Response, node-fetch Response, undici Response, etc.
 */
export interface ResponseLike {
  url: string;
  blob(): Promise<BlobLike>;
}

const isResponseLike = (value: any): value is ResponseLike =>
  value != null &&
  typeof value === 'object' &&
  typeof value.url === 'string' &&
  typeof value.blob === 'function';

export type ToFileInput =
  | FileLike
  | ResponseLike
  | Exclude<BlobLikePart, string>
  | AsyncIterable<BlobLikePart>;

export const checkFileSupport = () => {
  if (typeof File === 'undefined') {
    const { process } = globalThis as any;
    const isOldNode =
      typeof process?.versions?.node === 'string' && parseInt(process.versions.node.split('.')) < 20;
    throw new Error(
      '`File` is not defined as a global, which is required for file uploads.' +
        (isOldNode ?
          " Update to Node 20 LTS or newer, or set `globalThis.File` to `import('node:buffer').File`."
        : ''),
    );
  }
};

export function getName(value: any): string | undefined {
  return (
    (
      (typeof value === 'object' &&
        value !== null &&
        (('name' in value && value.name && String(value.name)) ||
          ('url' in value && value.url && String(value.url)) ||
          ('filename' in value && value.filename && String(value.filename)) ||
          ('path' in value && value.path && String(value.path)))) ||
      ''
    )
      .split(/[\\/]/)
      .pop() || undefined
  );
}

/**
 * Helper for creating a {@link File} to pass to an SDK upload method from a variety of different data formats
 * @param value the raw content of the file.  Can be an {@link Uploadable}, {@link BlobLikePart}, or {@link AsyncIterable} of {@link BlobLikePart}s
 * @param {string=} name the name of the file. If omitted, toFile will try to determine a file name from bits if possible
 * @param {Object=} options additional properties
 * @param {string=} options.type the MIME type of the content
 * @param {number=} options.lastModified the last modified timestamp
 * @returns a {@link File} with the given properties
 */
export async function toFile(
  value: ToFileInput | PromiseLike<ToFileInput>,
  name?: string | null | undefined,
  options?: FilePropertyBag | undefined,
): Promise<File> {
  checkFileSupport();

  // If it's a promise, resolve it.
  value = await value;

  // If we've been given a `File` we don't need to do anything
  if (isFileLike(value)) {
    if (value instanceof File) {
      return value;
    }
    return makeFile([await value.arrayBuffer()], value.name);
  }

  if (isResponseLike(value)) {
    const blob = await value.blob();
    name ||= new URL(value.url).pathname.split(/[\\/]/).pop();

    return makeFile(await getBytes(blob), name, options);
  }

  const parts = await getBytes(value);

  name ||= getName(value);

  if (!options?.type) {
    const type = parts.find((part) => typeof part === 'object' && 'type' in part && part.type);
    if (typeof type === 'string') {
      options = { ...options, type };
    }
  }

  return makeFile(parts, name, options);
}

async function getBytes(value: BlobLikePart | AsyncIterable<BlobLikePart>): Promise<Array<BlobPart>> {
  let parts: Array<BlobPart> = [];
  if (
    typeof value === 'string' ||
    ArrayBuffer.isView(value) || // includes Uint8Array, Buffer, etc.
    value instanceof ArrayBuffer
  ) {
    parts.push(value);
  } else if (isBlobLike(value)) {
    parts.push(value instanceof Blob ? value : await value.arrayBuffer());
  } else if (
    isAsyncIterable(value) // includes Readable, ReadableStream, etc.
  ) {
    for await (const chunk of value) {
      parts.push(...(await getBytes(chunk as BlobLikePart))); // TODO, consider validating?
    }
  } else {
    const constructor = value?.constructor?.name;
    throw new Error(
      `Unexpected data type: ${typeof value}${
        constructor ? `; constructor: ${constructor}` : ''
      }${propsForError(value)}`,
    );
  }

  return parts;
}

function propsForError(value: unknown): string {
  if (typeof value !== 'object' || value === null) return '';
  const props = Object.getOwnPropertyNames(value);
  return `; props: [${props.map((p) => `"${p}"`).join(', ')}]`;
}
