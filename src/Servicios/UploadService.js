import { supabase } from "./Supabase";

export async function subirFoto(base64) {
  const nombreArchivo = `foto_${Date.now()}.jpg`;

  const { error } = await supabase.storage
    .from("fotos")
    .upload(nombreArchivo, decodeBase64(base64), {
      contentType: "image/jpeg",
    });

  if (error) throw error;

  const { data: urlData } = supabase.storage
    .from("fotos")
    .getPublicUrl(nombreArchivo);

  return urlData.publicUrl;
}

function decodeBase64(base64) {
  const base64Data = base64.split("base64,")[1];
  const byteCharacters = atob(base64Data);
  const byteArrays = [];

  for (let i = 0; i < byteCharacters.length; i++) {
    byteArrays.push(byteCharacters.charCodeAt(i));
  }

  return new Uint8Array(byteArrays);
}
