import { useState } from "react";

function validarRut(rut) {
  rut = rut.replace(/\./g, "").replace("-", "");

  if (!/^\d{7,8}[0-9kK]$/.test(rut)) return false;

  const cuerpo = rut.slice(0, -1);
  let dv = rut.slice(-1).toUpperCase();

  let suma = 0;
  let multiplo = 2;

  for (let i = cuerpo.length - 1; i >= 0; i--) {
    suma += multiplo * cuerpo[i];
    multiplo = multiplo < 7 ? multiplo + 1 : 2;
  }

  const dvEsperado = 11 - (suma % 11);
  const dvFinal =
    dvEsperado === 11 ? "0" :
    dvEsperado === 10 ? "K" :
    dvEsperado.toString();

  return dv === dvFinal;
}

export default function CuestionarioTexto({
  onNext,
  placeholder = "",
  tipoValidacion = "texto",
  disabled,
  currentValue = ""
}) {
  const [valor, setValor] = useState(currentValue);
  const [error, setError] = useState(false);

  const handleChange = (e) => {
    const nuevoValor = e.target.value;
    setValor(nuevoValor);

    // Validamos en tiempo real
    if (tipoValidacion === "rut" && nuevoValor.length > 0) {
      const esValido = validarRut(nuevoValor);
      setError(!esValido);
      // Solo enviamos el valor al padre si es un RUT válido (o si prefieres, enviamos null para invalidar)
      onNext(esValido ? nuevoValor : null); 
    } else {
      onNext(nuevoValor);
    }
  };

  return (
    <div className="input-container">
      <input
        type="text"
        className={`input-texto-moderno ${error ? "input-error" : ""}`}
        value={valor}
        onChange={handleChange}
        placeholder={placeholder}
        disabled={disabled}
      />
      {error && (
        <span className="error-mensaje">RUT inválido. Formato: 12345678-9</span>
      )}
    </div>
  );
}