import React from 'react';

export default function CuestionarioUnico({ opciones, currentValue, onNext }) {
  return (
    <div className="opciones-grid">
      {opciones.map((opt) => (
        <div 
          key={opt.idopcion} 
          className={`opcion-card ${currentValue === opt.descripcion ? 'activa' : ''}`}
          onClick={() => onNext(opt.descripcion)}
        >
          <span className="check-texto">{opt.descripcion}</span>
        </div>
      ))}
    </div>
  );
}