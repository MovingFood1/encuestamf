import { supabase } from "./Supabase";

// Obtener todas las preguntas
export async function getPreguntas() {
  const { data, error } = await supabase
    .from("pregunta")
    .select("idpregunta, tipopregunta, descripcion");

  if (error) throw error;
  return data;
}

// Obtener opciones de una pregunta
export async function getOpciones(idpregunta) {
  const { data, error } = await supabase
    .from("tiporespuesta")
    .select("idopcion, idpregunta, descripcion")
    .eq("idpregunta", idpregunta);

  if (error) throw error;
  return data;
}

// Insertar respuesta
export async function insertarRespuesta(respuesta) {
  const { error } = await supabase.from("respuesta").insert(respuesta);

  if (error) {
    console.error("Error insertando respuesta:", error);
    throw error;
  }
}

// SUBIR FOTO A STORAGE
export async function subirFoto(file) {
  const fileName = `${Date.now()}_${file.name}`;

  const { error: uploadError } = await supabase.storage
    .from("fotos") // bucket
    .upload(fileName, file);

  if (uploadError) {
    console.error(uploadError);
    throw uploadError;
  }

  // obtener URL pública
  const { data } = supabase.storage
    .from("fotos")
    .getPublicUrl(fileName);

  return data.publicUrl;
}
