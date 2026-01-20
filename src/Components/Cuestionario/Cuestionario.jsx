import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../Servicios/Supabase";
import "./Cuestionario.css";

import { 
  getPreguntas, 
  getOpciones, 
  insertarRespuesta, 
  subirFoto 
} from "../../Servicios/PreguntaS";

import CuestionarioUnico from "./CuestionarioUnico";
import CuestionarioFoto from "./CuestionarioFoto";
import CuestionarioTexto from "./CuestionarioTexto";

export default function Cuestionario() {
  const [preguntas, setPreguntas] = useState([]);
  const [opcionesMap, setOpcionesMap] = useState({});
  const [respuestasValues, setRespuestasValues] = useState({});
  const [isProcessing, setIsProcessing] = useState(false);

  const navigate = useNavigate();

  // 1. Recuperamos los datos del vendedor desde el sessionStorage
  const nombreVendedor = sessionStorage.getItem("nombreencuestado");
  const idVendedor = sessionStorage.getItem("id_vendedor");
  const idSupervisor = sessionStorage.getItem("id_supervisor");

  useEffect(() => {
    // Si no hay vendedor (ej. alguien refrescó la página o entró directo), volvemos al inicio
    if (!idVendedor) {
      navigate("/");
      return;
    }

    async function cargarDatosIniciales() {
      try {
        const listaPreguntas = await getPreguntas();
        setPreguntas(listaPreguntas);

        const map = {};
        for (const p of listaPreguntas) {
          if (p.tipopregunta === "unica" || p.tipopregunta === "multiple") {
            map[p.idpregunta] = await getOpciones(p.idpregunta);
          }
        }
        setOpcionesMap(map);
      } catch (error) {
        console.error("Error cargando datos:", error);
      }
    }
    cargarDatosIniciales();
  }, [idVendedor, navigate]);

  const handleCambioRespuesta = (idPregunta, valor) => {
    setRespuestasValues(prev => ({ ...prev, [idPregunta]: valor }));
  };

  const enviarFormulario = async (respuestasFinales) => {
    try {
      // 2. Buscamos al supervisor usando el ID que recuperamos del session
      const { data: supervisor } = await supabase
        .from("supervisor")
        .select("email, nombre")
        .eq("id_supervisor", Number(idSupervisor))
        .maybeSingle();

      if (!supervisor) return;

      const { data: descripciones } = await supabase
        .from("tiporespuesta")
        .select("idopcion, descripcion");

      const datosParaEnviar = respuestasFinales.map(r => {
        const preguntaOriginal = preguntas.find(p => p.idpregunta === r.idpregunta);
        const opcionDB = descripciones?.find(d => d.idopcion.toString() === r.respuesta?.toString());
        
        return {
          pregunta: preguntaOriginal ? preguntaOriginal.descripcion : `Pregunta ${r.idpregunta}`,
          respuesta: r.fotourl ? "Imagen adjunta" : (opcionDB ? opcionDB.descripcion : r.respuesta),
          fotourl: r.fotourl || null
        };
      });

      await supabase.functions.invoke('enviar-correo', {
        body: {
          email: supervisor.email,
          nombreSupervisor: supervisor.nombre,
          encuestado: nombreVendedor,
          respuestas: datosParaEnviar
        },
      });
    } catch (err) {
      console.error("Error en envío:", err);
    }
  };

  const finalizarEncuesta = async () => {
    // 1. PRIMERO VALIDAR (Sin insertar nada aún)
    for (const p of preguntas) {
      const valor = respuestasValues[p.idpregunta];
      const esOpcional = p.descripcion.toLowerCase().includes("transporte");

      if (!esOpcional && (valor === null || valor === undefined || valor === "")) {
        alert(`La pregunta "${p.descripcion}" es obligatoria o tiene un formato inválido.`);
        return;
      }
    }

    // 2. SI TODO ESTÁ BIEN, PROCESAR
    try {
      setIsProcessing(true);
      const listaParaCorreo = [];

      // Usamos un solo loop para subir fotos, insertar en DB y preparar el correo
      for (const p of preguntas) {
        const valor = respuestasValues[p.idpregunta];
        let urlFoto = null;

        if (p.tipopregunta === "foto" && valor) {
          // Subir imagen al Bucket
          urlFoto = await subirFoto(valor, nombreVendedor);
          
          // Insertar en tabla respuesta
          await insertarRespuesta({ 
            idpregunta: p.idpregunta, 
            fotourl: urlFoto, 
            id_vendedor: idVendedor, // ID numérico de tu tabla
            fecha: new Date() 
          });
        } else {
          // Insertar texto o opción única
          await insertarRespuesta({ 
            idpregunta: p.idpregunta, 
            descripcion: p.tipopregunta === "texto" ? valor : null,
            idopcion: p.tipopregunta === "unica" ? valor : null,
            id_vendedor: idVendedor, // ID numérico de tu tabla
            fecha: new Date() 
          });
        }

        // Preparar objeto para el correo
        listaParaCorreo.push({
          idpregunta: p.idpregunta,
          pregunta: p.descripcion,
          respuesta: urlFoto || valor,
          fotourl: urlFoto
        });
      }

      // 3. ENVIAR CORREO Y NAVEGAR
      await enviarFormulario(listaParaCorreo);
      navigate("/gracias");

    } catch (error) {
      console.error("Error al finalizar:", error);
      alert("Error: " + error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="cuestionario-container">
      <h1 className="titulo-encuesta">Registro de Visita</h1>
      <div className="vendedor-badge">
        Vendedor: <strong>{nombreVendedor}</strong>
      </div>
      
      {preguntas.map((p) => (
        <div key={p.idpregunta} className="cuestionario-card section-pregunta">
          <h3 className="pregunta-descripcion">{p.descripcion}</h3>
          
          {p.tipopregunta === "unica" && (
            <CuestionarioUnico 
              opciones={opcionesMap[p.idpregunta] || []} 
              onNext={(val) => handleCambioRespuesta(p.idpregunta, val)} 
              currentValue={respuestasValues[p.idpregunta]}
            />
          )}

          {p.tipopregunta === "texto" && (
            <CuestionarioTexto 
              onNext={(val) => handleCambioRespuesta(p.idpregunta, val)}
              placeholder={p.descripcion}
              // AQUÍ DETERMINAMOS LA VALIDACIÓN DINÁMICAMENTE
              tipoValidacion={
                p.descripcion.toLowerCase().includes("rut") ? "rut" : 
                (p.descripcion.toLowerCase().includes("teléfono") || p.descripcion.toLowerCase().includes("celular")) ? "telefono" :
                (p.descripcion.toLowerCase().includes("correo") || p.descripcion.toLowerCase().includes("email")) ? "email" : 
                "texto"
              }
              currentValue={respuestasValues[p.idpregunta]}
            />
          )}

          {p.tipopregunta === "foto" && (
            <CuestionarioFoto onNext={(val) => handleCambioRespuesta(p.idpregunta, val)} disabled={isProcessing} />
          )}
        </div>
      ))}

      <button className="btn-siguiente btn-finalizar" onClick={finalizarEncuesta} disabled={isProcessing}>
        {isProcessing ? "Enviando Reporte..." : "Finalizar y Enviar"}
      </button>
    </div>
  );
}