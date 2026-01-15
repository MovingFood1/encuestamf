import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../Servicios/Supabase";
import "./Cuestionario.css";

import { getPreguntas, getOpciones, insertarRespuesta, subirFoto } from "../../Servicios/PreguntaS";

import CuestionarioUnico from "./CuestionarioUnico";
import CuestionarioFoto from "./CuestionarioFoto";
import CuestionarioTexto from "./CuestionarioTexto";

export default function Cuestionario() {
  const [preguntas, setPreguntas] = useState([]);
  const [opcionesMap, setOpcionesMap] = useState({}); // Guardaremos opciones por ID de pregunta
  const [respuestasValues, setRespuestasValues] = useState({}); // { idPregunta: valor }
  const [isProcessing, setIsProcessing] = useState(false);

  const navigate = useNavigate();
  const nombre = sessionStorage.getItem("nombreencuestado");

  useEffect(() => {
    async function cargarTodo() {
      const listaPreguntas = await getPreguntas();
      setPreguntas(listaPreguntas);

      // Cargamos todas las opciones de una vez para las preguntas de selección
      const map = {};
      for (const p of listaPreguntas) {
        if (p.tipopregunta === "unica" || p.tipopregunta === "multiple") {
          map[p.idpregunta] = await getOpciones(p.idpregunta);
        }
      }
      setOpcionesMap(map);
    }
    cargarTodo();
  }, []);

  // Función para capturar cambios de cada pregunta sin avanzar de página
  const handleCambioRespuesta = (idPregunta, valor) => {
    setRespuestasValues(prev => ({
      ...prev,
      [idPregunta]: valor
    }));
  };

  const enviarFormulario = async (respuestasFinales) => {
    try {
      const supervisorRespuesta = respuestasFinales.find(r => r.idpregunta === 11);
      if (!supervisorRespuesta) return;

      const { data: supervisor } = await supabase
        .from("supervisor")
        .select("email, nombre")
        .eq("id", Number(supervisorRespuesta.respuesta))
        .maybeSingle();

      if (!supervisor) return;

      const idsOpciones = respuestasFinales
        .filter(r => !r.fotourl && !isNaN(r.respuesta) && r.respuesta !== "")
        .map(r => r.respuesta);

      const { data: descripciones } = await supabase
        .from("tiporespuesta")
        .select("idopcion, descripcion")
        .in("idopcion", idsOpciones);

      const datosParaEnviar = respuestasFinales
        .filter(r => r.idpregunta !== 11)
        .map(r => {
          const preguntaOriginal = preguntas.find(p => p.idpregunta === r.idpregunta);
          const opcionDB = descripciones?.find(d => d.idopcion.toString() === r.respuesta?.toString());
          return {
            pregunta: preguntaOriginal ? preguntaOriginal.descripcion : `Pregunta ${r.idpregunta}`,
            respuesta: r.fotourl ? "Archivo de imagen adjunto" : (opcionDB ? opcionDB.descripcion : r.respuesta),
            fotourl: r.fotourl || null
          };
        });

      await supabase.functions.invoke('enviar-correo', {
        body: {
          email: supervisor.email,
          nombreSupervisor: supervisor.nombre,
          encuestado: nombre,
          respuestas: datosParaEnviar
        },
      });
    } catch (err) {
      console.error("Error enviando mail:", err);
    }
  };

  const finalizarEncuesta = async () => {
    // 1. Verificar que todo esté respondido
    const respondidas = Object.keys(respuestasValues).length;
    if (respondidas < preguntas.length) {
      alert("Por favor, responde todas las preguntas.");
      return;
    }

    // 2. Verificar si hay algún valor nulo (RUTs que fallaron la validación)
    const hayErrores = Object.values(respuestasValues).some(valor => valor === null);
    if (hayErrores) {
      alert("Hay campos con errores (como el RUT). Por favor corrígelos antes de enviar.");
      return;
    }
    // Validación: ¿Están todas las preguntas respondidas?
    if (Object.keys(respuestasValues).length < preguntas.length) {
      alert("Por favor, responde todas las preguntas antes de enviar.");
      return;
    }

    try {
      setIsProcessing(true);
      const listaParaCorreo = [];

      for (const p of preguntas) {
        const valor = respuestasValues[p.idpregunta];
        let urlFoto = null;

        if (p.tipopregunta === "foto") {
          urlFoto = await subirFoto(valor, nombre);
          await insertarRespuesta({ idpregunta: p.idpregunta, fotourl: urlFoto, nombreencuestado: nombre, fecha: new Date() });
        } else if (p.tipopregunta === "texto") {
          await insertarRespuesta({ idpregunta: p.idpregunta, descripcion: valor, nombreencuestado: nombre, fecha: new Date() });
        } else {
          await insertarRespuesta({ idpregunta: p.idpregunta, idopcion: valor, nombreencuestado: nombre, fecha: new Date() });
        }

        listaParaCorreo.push({
          idpregunta: p.idpregunta,
          pregunta: p.descripcion,
          respuesta: urlFoto || valor,
          fotourl: urlFoto
        });
      }

      await enviarFormulario(listaParaCorreo);
      navigate("/gracias");
    } catch (error) {
      console.error(error);
      alert("Error al enviar la encuesta");
    } finally {
      setIsProcessing(false);
    }
  };

  // ... (aquí mantienes tu función enviarFormulario igual que antes) ...

  return (
    <div className="cuestionario-container">
      <h1 className="titulo-encuesta">Formulario de Registro</h1>
      
      {preguntas.map((p) => (
        <div key={p.idpregunta} className="cuestionario-card section-pregunta">
          <h3 className="pregunta-descripcion">{p.descripcion}</h3>
          
          {p.tipopregunta === "unica" && (
            <CuestionarioUnico 
              opciones={opcionesMap[p.idpregunta] || []} 
              onNext={(val) => handleCambioRespuesta(p.idpregunta, val)} 
              isStatic={true} // Nueva prop para que no auto-avance
              currentValue={respuestasValues[p.idpregunta]}
            />
          )}

          {p.tipopregunta === "texto" && (
            <CuestionarioTexto 
              onNext={(val) => handleCambioRespuesta(p.idpregunta, val)}
              placeholder="Escribe aquí..."
              tipoValidacion={p.descripcion.toLowerCase().includes("rut") ? "rut" : "texto"}
            />
          )}

          {p.tipopregunta === "foto" && (
            <CuestionarioFoto onNext={(val) => handleCambioRespuesta(p.idpregunta, val)} />
          )}
        </div>
      ))}

      <button 
        className="btn-siguiente btn-finalizar" 
        onClick={finalizarEncuesta}
        disabled={isProcessing}
      >
        {isProcessing ? "Enviando Todo..." : "Enviar Encuesta"}
      </button>
    </div>
  );
}