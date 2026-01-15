import { useState, useRef } from "react";

function base64ToFile(base64, fileName) {
  const arr = base64.split(",");
  const mime = arr[0].match(/:(.*?);/)[1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) u8arr[n] = bstr.charCodeAt(n);
  return new File([u8arr], fileName, { type: mime });
}

export default function CuestionarioFoto({ onNext, disabled }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [fotoPreview, setFotoPreview] = useState(null);
  const [camaraActiva, setCamaraActiva] = useState(false);

  const iniciarCamara = async () => {
    try {
      setCamaraActiva(true);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          // "ideal" le dice al navegador que intente usar la trasera primero
          facingMode: { ideal: "environment" },
          // Añadir resolución ayuda a que no se vea borroso
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Error al acceder a la cámara:", err);
      alert("No se pudo acceder a la cámara.");
    }
  };

  const capturarFoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    if (!video || !canvas) return; // Validación de seguridad

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0);

    const imagenBase64 = canvas.toDataURL("image/jpeg");
    setFotoPreview(imagenBase64);
    
    // Detener la cámara de forma segura
    const stream = video.srcObject;
    if (stream) {
      const tracks = stream.getTracks();
      tracks.forEach(track => track.stop());
    }
    
    setCamaraActiva(false);

    // Enviamos el archivo al componente padre
    const file = base64ToFile(imagenBase64, `evidencia_${Date.now()}.jpg`);
    onNext(file);
  };

  const reintentar = () => {
    setFotoPreview(null);
    iniciarCamara();
  };

  return (
    <div className="foto-container">
      {!fotoPreview ? (
        <div className="camara-wrapper">
          {camaraActiva ? (
            <>
              <video ref={videoRef} autoPlay className="video-preview"></video>
              <button className="btn-siguiente btn-capturar" onClick={capturarFoto} disabled={disabled}>
                📸 Capturar Fotografía
              </button>
            </>
          ) : (
            <button className="btn-siguiente btn-activar" onClick={iniciarCamara} disabled={disabled}>
              📷 Activar Cámara
            </button>
          )}
        </div>
      ) : (
        <div className="preview-wrapper">
          <img src={fotoPreview} alt="Vista previa" className="foto-preview-img" />
          {!disabled && (
            <button className="btn-reintentar" onClick={reintentar}>
              🔄 Tomar otra foto
            </button>
          )}
          {disabled && <p className="text-subiendo">Foto lista para enviar...</p>}
        </div>
      )}
      <canvas ref={canvasRef} style={{ display: "none" }}></canvas>
    </div>
  );
}