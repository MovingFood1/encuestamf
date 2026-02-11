import { useRef } from "react";
import SignatureCanvas from "react-signature-canvas";

export default function CuestionarioFirma({onNext, isProcessing}) {
    const sigCanvas = useRef({});

    const limpiar = () => sigCanvas.current.clear();

    const guardar = () => {
        if (sigCanvas.current && !sigCanvas.current.isEmpty()) {
            
            // 1. EXTRAEMOS LA IMAGEN DIRECTAMENTE
            const canvas = sigCanvas.current.getCanvas();
            const dataURL = canvas.toDataURL('image/png');
            
            // 2. ENVIAMOS AL PADRE
            onNext(dataURL);
            
            // 3. OPCIONAL: Feedback para el usuario
            console.log("Firma fijada con éxito");
        } else {
            alert("Por favor, firma antes de continuar.");
        }
    };

    return (
        <div className="firma-container">
            <div style={{border: '1px solid #ccc', background: '#fff'}}>
                <SignatureCanvas 
                ref={sigCanvas}
                canvasProps={{ width: 300, height: 200, className: 'sigCanvas' }}
                />
            </div>
            <div className="botones-firma">
                <button onClick={limpiar} disabled={isProcessing}>Limpiar</button>
                <button onClick={guardar} disabled={isProcessing}>Fijar Firma</button>
            </div>
        </div>
    );
}