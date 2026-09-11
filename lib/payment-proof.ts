export function matchesImageSignature(bytes: ArrayBuffer, mime: string) {
  const view = new Uint8Array(bytes);
  if (mime === "image/png") return view.length >= 8 && [137, 80, 78, 71, 13, 10, 26, 10].every((value, index) => view[index] === value);
  if (mime === "image/jpeg") return view.length >= 3 && view[0] === 0xff && view[1] === 0xd8 && view[2] === 0xff;
  if (mime === "image/webp") return view.length >= 12 && String.fromCharCode(...view.slice(0, 4)) === "RIFF" && String.fromCharCode(...view.slice(8, 12)) === "WEBP";
  return false;
}
