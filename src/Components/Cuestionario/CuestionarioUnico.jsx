export default function CuestionarioUnico({ opciones, onNext, currentValue }) {

  return (
    <div className="opciones-grid">
      {opciones.map((op) => (
        <div
          key={op.idopcion}
          className={`opcion-card ${currentValue === op.idopcion ? "seleccionada" : ""}`}
          onClick={() => onNext(op.idopcion)}
        >
          {op.descripcion}
        </div>
      ))}
    </div>
  );
}