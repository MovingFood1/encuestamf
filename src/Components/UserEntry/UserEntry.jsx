import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getVendedores } from "../../Servicios/PreguntaS"; // Asegúrate que la ruta sea correcta

export default function UserEntry() {
  const [vendedores, setVendedores] = useState([]);
  const [cargando, setCargando] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    async function cargar() {
      const lista = await getVendedores();
      setVendedores(lista);
      setCargando(false);
    }
    cargar();
  }, []);

  const seleccionarVendedor = (v) => {
    // Guardamos toda la información necesaria en el session
    sessionStorage.setItem("nombreencuestado", v.nombre);
    sessionStorage.setItem("id_vendedor", v.id_vendedor);
    sessionStorage.setItem("id_supervisor", v.id_supervisor);
    
    // Al elegir, saltamos directamente a la encuesta
    navigate("/encuesta");
  };

  return (
    <div className="cuestionario-container">
      <div className="cuestionario-card">
        <h2 className="titulo-encuesta">Bienvenido/a</h2>
        <p style={{ textAlign: "center", marginBottom: "20px", color: "#666" }}>
          Selecciona tu nombre de la lista para comenzar
        </p>

        {cargando ? (
          <p style={{ textAlign: "center" }}>Cargando vendedores...</p>
        ) : (
          <div className="vendedor-list-container">
            {vendedores.map((v) => (
              <div
                key={v.id_vendedor}
                className="opcion-card"
                onClick={() => seleccionarVendedor(v)}
                style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    marginBottom: '10px'
                }}
              >
                <div>
                  <strong style={{ display: 'block' }}>{v.nombre}</strong>
                  <small style={{ color: '#888' }}>Zona: {v.zona}</small>
                </div>
                <span style={{ color: '#3498db', fontWeight: 'bold' }}>→</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}