import React from 'react';

export default function CuestionarioMultiple({ opciones, currentValue, onChange }) {
  const seleccionadas = currentValue ? currentValue.split(", ") : [];

  const handleToggle = (descripcion) => {
    let nuevasSeleccionadas;
    if (seleccionadas.includes(descripcion)) {
      nuevasSeleccionadas = seleccionadas.filter(item => item !== descripcion);
    } else {
      nuevasSeleccionadas = [...seleccionadas, descripcion];
    }
    onChange(nuevasSeleccionadas.join(", "));
  };

  return (
    <div className="opciones-grid">
      {opciones.map((opt) => (
        <div 
          key={opt.idopcion} 
          className={`opcion-card ${seleccionadas.includes(opt.descripcion) ? 'activa' : ''}`}
          onClick={() => handleToggle(opt.descripcion)}
        >
          <span className="check-texto">{opt.descripcion}</span>
        </div>
      ))}
    </div>
  );
}